// @vitest-environment happy-dom
import {beforeEach,it,expect,vi} from 'vitest'
vi.mock('./api.js',()=>({api:vi.fn(async()=>{throw new Error('offline')}),setRemoteAuth:vi.fn()}))
import {useStore,DEF} from '../store/useStore.js'
import {blankHealth} from './personal-health.js'
import {loadHealth,saveHealth,migratePersonal,HEALTH_KEY} from './personal-state.js'
import {mergeStates} from './sync-merge.js'
import {exportBackupZip,readBackupFile} from './backup-media.js'
beforeEach(()=>{localStorage.clear();useStore.setState({S:structuredClone(DEF),ready:true,user:null})})
it('migrates the old personal document only once and persists it with the training state',()=>{const h=blankHealth();h.profile.goal='增肌';localStorage.setItem(HEALTH_KEY,JSON.stringify(h));migratePersonal();expect(loadHealth().profile.goal).toBe('增肌');expect(JSON.parse(localStorage.getItem('gym_state_v1')).personal.profile.goal).toBe('增肌');useStore.setState({S:structuredClone(DEF)});migratePersonal();expect(loadHealth().profile.goal).toBe('')})
it('switching the training account does not expose the previous personal profile',()=>{saveHealth({...blankHealth(),profile:{...blankHealth().profile,goal:'私有目标'}});useStore.setState({S:structuredClone(DEF),user:{id:'other'}});expect(loadHealth().profile.goal).toBe('')})
it('a server report and an offline journal edit both survive merging',()=>{const base={...structuredClone(DEF),personal:blankHealth()};const a={...base,_ts:100,personal:{...base.personal,_ts:100,_settingsAt:50,profile:{...base.personal.profile,goal:'新目标'},journal:[{id:'a',date:'2026-11-01',text:'补录',_ts:100}]}};const b={...base,_ts:200,personal:{...base.personal,_ts:200,reports:[{id:'周报:2026-10-26',kind:'周报',from:'2026-10-26',to:'2026-11-02',text:'报告',source:{},_ts:200}]}};const out=mergeStates(a,b);expect(out.personal.profile.goal).toBe('新目标');expect(out.personal.journal).toHaveLength(1);expect(out.personal.reports).toHaveLength(1)})
it('a full ZIP round trip includes personal records and saved conversations',async()=>{const h={...blankHealth(),chats:[{id:'q',text:'回答',question:'问题',source:{},_ts:20}]};saveHealth(h);const {blob}=await exportBackupZip(useStore.getState().S,{media:{get:async()=>null}});const {state}=await readBackupFile(blob);useStore.getState().importBackup(state);expect(loadHealth().chats[0].text).toBe('回答')})
