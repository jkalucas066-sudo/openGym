import test from 'node:test';
import assert from 'node:assert/strict';
import { tempData } from './helpers.mjs';
tempData();
const cfg=await import('../coach/config.js');
const {coachRoutes}=await import('../coach/routes.js');
cfg.save({enabled:true,provider:'fixture'});
function routes(user){return coachRoutes({readSession:()=>user,requireAdmin:()=>user,readBody:async()=>({}),json:(res,status,body)=>Object.assign(res,{status,body})})}
test('personal status requires a session',async()=>{const r={};await routes(null)['GET /api/personal/ai']({},r);assert.equal(r.status,401)});
test('fixture status never claims real AI is ready and exposes no credential',async()=>{const r={};await routes({id:'test'})['GET /api/personal/ai']({},r);assert.equal(r.body.ready,false);assert.equal(r.body.testing,true);assert.deepEqual(Object.keys(r.body).sort(),['model','provider','ready','testing'])});
test('personal requests refuse fixture instead of returning fabricated success',async()=>{const r={};await routes({id:'test'})['POST /api/personal/completion']({},r);assert.equal(r.status,409);assert.match(r.body.error,/真实模型/)});
