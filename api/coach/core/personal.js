// Shared by the phone and the server. No credentials or browser APIs in this document.
export const blankHealth = () => ({version:1,profile:{goal:'',limitations:'',equipment:'',background:''},journal:[],reports:[],chats:[],guides:[],model:'',automatic:false,lastBackup:null,planDraft:null,_draftAt:0,_ts:0,_settingsAt:0})
export const dateKey = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
export function dateInZone(now=new Date(),zone='Asia/Shanghai') {
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]))
  return new Date(Number(p.year),Number(p.month)-1,Number(p.day),12)
}
const fields=['goal','limitations','equipment','background']
export function validateHealth(x) {
  if(!x||x.version!==1||!x.profile||!fields.every(k=>typeof x.profile[k]==='string')||!Array.isArray(x.journal)||!Array.isArray(x.reports))throw new Error('个人档案文件格式不正确')
  const records=(items,kind)=>{
    if(!Array.isArray(items))throw new Error('个人记录格式不正确')
    return items.map(e=>{
      if(!e||typeof e.id!=='string'||typeof e.text!=='string'||(kind==='journal'&&!/^\d{4}-\d{2}-\d{2}$/.test(e.date))||(kind==='report'&&(!e.source||typeof e.from!=='string'||typeof e.to!=='string')))throw new Error('个人记录格式不正确')
      return Object.fromEntries(['id','date','text','recordedAt','updatedAt','deleted','_ts','kind','from','to','source','createdAt','history','question','exerciseId'].filter(k=>k in e).map(k=>[k,e[k]]))
    })
  }
  if(x.planDraft&&(!x.planDraft.bundle||!Array.isArray(x.planDraft.bundle.routines)||!x.planDraft.source))throw new Error('待确认计划格式不正确')
  return {...blankHealth(),profile:Object.fromEntries(fields.map(k=>[k,x.profile[k]])),journal:records(x.journal,'journal'),reports:records(x.reports,'report'),chats:records(x.chats||[],'chat'),guides:records(x.guides||[],'guide'),model:typeof x.model==='string'?x.model:'',automatic:x.automatic===true,lastBackup:typeof x.lastBackup==='string'?x.lastBackup:null,planDraft:x.planDraft?{bundle:x.planDraft.bundle,source:x.planDraft.source}:null,_draftAt:Number(x._draftAt)||0,_ts:Number(x._ts)||0,_settingsAt:Number(x._settingsAt)||0}
}
export function mergeHealth(a,b) {
  if(!a)return b;if(!b)return a
  const newest=(Number(a._ts)||0)>=(Number(b._ts)||0)?a:b, other=newest===a?b:a
  const out={...newest}
  const settings=(a._settingsAt||0)>=(b._settingsAt||0)?a:b
  for(const k of ['profile','model','automatic','_settingsAt'])out[k]=settings[k]
  const draft=(a._draftAt||0)>=(b._draftAt||0)?a:b
  out.planDraft=draft.planDraft||null;out._draftAt=draft._draftAt||0
  out.lastBackup=[a.lastBackup,b.lastBackup].filter(Boolean).sort().at(-1)||null
  for(const k of ['journal','reports','chats','guides']){
    const rows=new Map((other[k]||[]).map(e=>[e.id,e]))
    for(const e of newest[k]||[]){const prev=rows.get(e.id);if(!prev||(Number(e._ts)||0)>=(Number(prev._ts)||0))rows.set(e.id,e)}
    out[k]=[...rows.values()].sort((x,y)=>(Number(y._ts)||0)-(Number(x._ts)||0))
  }
  return out
}
export function closedPeriods(now=new Date()) {
  const end=new Date(now.getFullYear(),now.getMonth(),now.getDate());end.setDate(end.getDate()-((end.getDay()+6)%7))
  const start=new Date(end);start.setDate(start.getDate()-7)
  return [{kind:'周报',from:dateKey(start),to:dateKey(end)},{kind:'月报',from:dateKey(new Date(now.getFullYear(),now.getMonth()-1,1)),to:dateKey(new Date(now.getFullYear(),now.getMonth(),1))}].map(p=>({...p,id:`${p.kind}:${p.from}`}))
}
export function analysisData(state,health,period=null) {
  const inRange=d=>!period||(d>=period.from&&d<period.to)
  return {exportedAt:new Date().toISOString(),period,profile:health.profile,units:state.unit||'kg',
    workouts:(state.workouts||[]).filter(w=>inRange(w.d)).map(w=>({id:w.id,date:w.d,name:w.name,heartRate:w.hr?{avg:w.hr.avg,max:w.hr.max,src:w.hr.src}:undefined,entries:(w.entries||[]).map(e=>({id:e.id,sets:(e.sets||[]).map(s=>({done:s.done,w:s.w,r:s.r,sec:s.sec,rir:s.rir,rpe:s.rpe})),note:e.note})),notes:w.note})),
    bodyweight:(state.bodyweight||[]).filter(w=>inRange(w.d)).map(w=>({date:w.d,weight:w.w})),
    measurements:(state.measurements||[]).filter(w=>inRange(w.d)).map(w=>({date:w.d,values:Object.fromEntries(['neck','shoulders','chest','waist','hips','abdomen','upperArmLeft','upperArmRight','forearmLeft','forearmRight','thighLeft','thighRight','calfLeft','calfRight','bodyFat'].filter(k=>typeof w[k]==='number').map(k=>[k,w[k]]))})),
    journal:(health.journal||[]).filter(e=>!e.deleted&&inRange(e.date)).map(e=>({id:e.id,date:e.date,text:e.text,recordedAt:e.recordedAt})),
    baseline:period?{bodyweight:(state.bodyweight||[]).filter(w=>w.d<period.from).slice(-4).map(w=>({date:w.d,weight:w.w}))}:undefined,
    missingData:'未记录不代表正常；照片、身份凭证和密钥不在本分析包中。'}
}
export const reportQuestion='用中文生成本周期复盘，分为记录事实、与历史可比的趋势、训练调整建议、饮食建议、下周行动。引用原始日期；不猜测油盐或精确热量，外食用份量和蛋白质来源表达；无依据不预测疾病。建议需本人确认，不自动改计划。'
export function computerAnalysisData(state,health){
  return {...analysisData(state,health),plan:{week:state.week,routines:(state.routines||[]).map(r=>({id:r.id,name:r.name,ex:(r.ex||[]).map(e=>({id:e.id,sets:e.sets,reps:e.reps,sec:e.sec,mode:e.mode,weight:e.w}))}))},aiOutputs:{reports:health.reports,chats:(health.chats||[]).filter(r=>!r.deleted),guides:health.guides||[]},notice:'训练和身体记录为用户记录；aiOutputs 是 AI 输出，不等于医学事实。'}
}
