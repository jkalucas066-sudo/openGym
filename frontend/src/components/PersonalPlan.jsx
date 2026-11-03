import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { generatePersonalPlan } from '../lib/personal-plan.js'
import { personalKey } from '../lib/personal-key.js'
import { parsePlan } from '../lib/plan-share.js'
import { planImportSheet } from '../sheets.jsx'
import { EXIDX } from '../lib/exercises.js'
import { exerciseNameFor } from '../lib/i18n.js'

export default function PersonalPlan({health,onProfileChange,onDraftChange}) {
  const [days,setDays]=useState(2),[minutes,setMinutes]=useState(25),[experience,setExperience]=useState('beginner'),[equipment,setEquipment]=useState(['body weight'])
  const pending=health.planDraft, setPending=onDraftChange
  const [busy,setBusy]=useState(false),[status,setStatus]=useState('')
  return <section className="card" style={{padding:16}}><h2>生成我的训练计划</h2><p>选择目标和时间，生成后先预览，再确认加入训练。</p>
    <label>训练目标<input value={health.profile.goal} placeholder="例如：恢复运动、居家增肌" onChange={e=>onProfileChange({...health.profile,goal:e.target.value})}/></label>
    <label>每周天数 <select value={days} onChange={e=>setDays(Number(e.target.value))}>{[1,2,3,4,5,6,7].map(n=><option key={n}>{n}</option>)}</select></label>{' '}
    <label>每次分钟 <select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}>{[15,20,25,30,45,60].map(n=><option key={n}>{n}</option>)}</select></label>
    <label style={{display:'block'}}>基础 <select value={experience} onChange={e=>setExperience(e.target.value)}><option value="beginner">初学 / 久未训练</option><option value="intermediate">有稳定训练基础</option></select></label>
    <div>{[['body weight','自重'],['dumbbell','哑铃'],['barbell','杠铃'],['band','弹力带']].map(([id,name])=><label key={id} style={{marginRight:12}}><input type="checkbox" checked={equipment.includes(id)} disabled={id==='body weight'} onChange={e=>setEquipment(e.target.checked?[...equipment,id]:equipment.filter(x=>x!==id))}/>{name}</label>)}</div>
    <button disabled={busy} onClick={async()=>{if(!health.profile.goal.trim()){setStatus('请填写上方训练目标，再生成计划。');return}setBusy(true);setStatus('正在生成并校验，可能需要几分钟…');try{setPending(await generatePersonalPlan({state:useStore.getState().S,profile:health.profile,options:{days,minutes,experience,equipment},key:await personalKey(),model:health.model}));setStatus('计划已校验，尚未修改训练。请先审阅。')}catch(e){setStatus(e.message)}finally{setBusy(false)}}}>生成计划并预览</button>
    <p role="status">{status}</p>{pending&&<><h3>{pending.bundle.name}</h3><p>{pending.bundle.summary}</p>{pending.bundle.routines.map((r,i)=><div key={i}><h3>{r.name}</h3><p>{r.why}</p><ul>{r.ex.map((e,j)=><li key={j}>{EXIDX[e.id]?exerciseNameFor(EXIDX[e.id]):e.id}：{e.sets} 组 × {e.mode==='time'?`${e.sec} 秒`:`${e.reps} 次`}<p>{e.why}</p></li>)}</ul></div>)}<details><summary>生成依据与原始资料</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{JSON.stringify(pending.source,null,2)}</pre></details><p>下一步仍有导入确认。默认添加为新训练，不替换周安排；需要替换时请在确认窗口勾选。</p><button onClick={()=>{try{planImportSheet(parsePlan(pending.bundle,useStore.getState().S.unit),{onApplied:()=>setPending(null)})}catch(e){setStatus(e.message)}}}>审阅完成，进入导入确认</button></>}
  </section>
}
