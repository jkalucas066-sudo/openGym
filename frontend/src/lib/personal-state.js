import {useStore} from '../store/useStore.js'
import {blankHealth,validateHealth} from '../../../api/coach/core/personal.js'
export const HEALTH_KEY='opengym.personal.v1'
export const loadHealth=()=>useStore.getState().S.personal||blankHealth()
export function saveHealth(next){
  const clean=validateHealth(next)
  clean._ts=Math.max(Date.now(),Number(loadHealth()._ts||0)+1)
  const before=loadHealth()
  if(['profile','model','automatic'].some(k=>JSON.stringify(before[k])!==JSON.stringify(clean[k])))clean._settingsAt=clean._ts
  if(JSON.stringify(before.planDraft)!==JSON.stringify(clean.planDraft))clean._draftAt=clean._ts
  useStore.getState().update(S=>{S.personal=clean})
  return clean
}
export function migratePersonal(){
  const store=useStore.getState()
  if(!store.ready||store.S.personal||localStorage.getItem(HEALTH_KEY+'.migrated'))return
  const raw=localStorage.getItem(HEALTH_KEY);if(!raw)return
  saveHealth(validateHealth(JSON.parse(raw)))
  // Preserve the old file for recovery, but never attach it to a later account.
  localStorage.setItem(HEALTH_KEY+'.migrated','1')
}
