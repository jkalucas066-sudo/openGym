import test from 'node:test';
import assert from 'node:assert/strict';
import {tempData} from './helpers.mjs';
tempData();
const {personalReports}=await import('../personal-reports.js');
const {blankHealth,mergeHealth,validateHealth}=await import('../coach/core/personal.js');
const now=()=>new Date('2026-11-03T08:00:00Z');
function fixture(){
  let state={workouts:[],bodyweight:[],routines:[],personal:{...blankHealth(),automatic:true,journal:[{id:'j',date:'2026-10-30',text:'练后记录'}]}};
  const f={calls:0,get:()=>state,set:s=>{state=s}};
  f.tick=personalReports({users:()=>[{id:'u'}],read:()=>state,commit:(_,personal)=>{state={...state,personal}},now,complete:async()=>{f.calls++;state={...state,workouts:[{id:'new',d:'2026-11-03'}]};return {text:'{"answer":"报告"}'}}});return f;
}
test('reports catch up once and preserve a workout synced during the API wait',async()=>{const f=fixture();await f.tick();assert.equal(f.calls,2);assert.equal(f.get().personal.reports.length,2);assert.equal(f.get().workouts[0].id,'new');await f.tick();assert.equal(f.calls,2)});
test('empty periods and disabled automatic reporting make no paid calls',async()=>{const f=fixture();f.set({...f.get(),personal:{...blankHealth(),automatic:true}});await f.tick();assert.equal(f.calls,0);f.set({...f.get(),personal:{...f.get().personal,automatic:false}});await f.tick();assert.equal(f.calls,0)});
test('failed reporting waits before retrying and leaves records untouched',async()=>{let calls=0;const f=fixture();const tick=personalReports({users:()=>[{id:'u'}],read:f.get,commit:()=>assert.fail('must not commit'),now,complete:async()=>{calls++;throw new Error('offline')}});await tick();await tick();assert.equal(calls,1);assert.equal(f.get().personal.reports.length,0)});
test('personal merge retains independent additions and later deletion markers',()=>{const a={...blankHealth(),_ts:3,journal:[{id:'a',date:'2026-11-01',text:'removed',deleted:true,_ts:3}]};const b={...blankHealth(),_ts:4,journal:[{id:'a',date:'2026-11-01',text:'old',_ts:1},{id:'b',date:'2026-11-02',text:'kept',_ts:4}]};const out=mergeHealth(a,b);assert.equal(out.journal.length,2);assert.equal(out.journal.find(r=>r.id==='a').deleted,true)});
test('personal backup keeps record IDs and removes credential fields',()=>{const h={...blankHealth(),journal:[{id:'j',date:'2026-11-01',text:'note',apiKey:'secret',_ts:8}],apiKey:'secret'};const restored=validateHealth(h);assert.equal(restored.journal[0].id,'j');assert.ok(!JSON.stringify(restored).includes('secret'))});
