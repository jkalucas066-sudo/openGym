import {loadHealth,saveHealth} from './personal-state.js'
import {personalKey} from './personal-key.js'
import {serverAI} from './personal-server.js'
import {MOBILE} from './mobile.js'
import {closedPeriods,analysisData,askHealth,reportQuestion} from './personal-health.js'
// A stand-alone phone cannot run JavaScript while closed. Catch up on foreground.
export function startPersonalSchedule(getStore){
  let running=false,retryAt=0
  async function tick(){
    if(running||Date.now()<retryAt||document.visibilityState==='hidden'||!getStore().ready||!getStore().S.personal?.automatic)return
    running=true
    const owner=getStore().user?.id
    try{
      const key=await personalKey();if(!key)return
      // A paired server owns scheduling when it has a working configuration.
      if(owner){try{if((await serverAI()).ready)return}catch{}}
      for(const p of closedPeriods()){
        const health=loadHealth();if(!health.automatic||getStore().user?.id!==owner)break
        if(health.reports.some(r=>r.id===p.id))continue
        const source=analysisData(getStore().S,health,p)
        if(!source.workouts.length&&!source.bodyweight.length&&!source.journal.length)continue
        const answer=await askHealth({key,model:health.model,source,question:reportQuestion})
        if(getStore().user?.id!==owner)break
        const latest=loadHealth();if(!latest.automatic)break
        if(!latest.reports.some(r=>r.id===p.id))saveHealth({...latest,reports:[{...p,text:answer,source,createdAt:new Date().toISOString(),_ts:Date.now()},...latest.reports]})
      }
    }catch{retryAt=Date.now()+6*3600000}finally{running=false}
  }
  let nativeListener,stopped=false
  if(MOBILE)import('@capacitor/app').then(async({App})=>{const listener=await App.addListener('appStateChange',({isActive})=>{if(isActive)tick()});if(stopped)listener.remove();else nativeListener=listener}).catch(()=>{})
  const timer=setInterval(tick,60000),initial=setTimeout(tick,5000)
  document.addEventListener('visibilitychange',tick)
  return()=>{stopped=true;clearInterval(timer);clearTimeout(initial);document.removeEventListener('visibilitychange',tick);nativeListener?.remove()}
}
