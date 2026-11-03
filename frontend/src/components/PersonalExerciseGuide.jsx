import {loadHealth,saveHealth} from '../lib/personal-state.js'
import { useState } from 'react'
import { askHealth } from '../lib/personal-health.js'
import { useStore } from '../store/useStore.js'
import { coachingFor } from '../lib/exercise-coaching.js'
import { personalKey } from '../lib/personal-key.js'
import { instrFor } from '../lib/i18n.js'

export default function PersonalExerciseGuide({exercise}) {
  const cached=useStore(s=>s.S.personal?.guides?.find(g=>g.exerciseId===exercise.id))
  const guide=coachingFor(exercise)
  const [answer,setAnswer]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[question,setQuestion]=useState(''),[source,setSource]=useState(null)
  async function ask() {
    const owner=useStore.getState().user?.id
    setBusy(true);setError('')
    try {
      const h=loadHealth()
      const data={exercise:{id:exercise.id,name:exercise.n,bodyPart:exercise.bp,equipment:exercise.eq,target:exercise.tg,steps:instrFor(exercise)},limitations:h.profile.limitations,experience:h.profile.background}
      setSource(data)
      const prompt=question.trim() || '为初学者分步骤解释此动作：起始姿势、每步怎么动、发力感觉、呼吸、参考节奏和常见错误。节奏只作为参考，不编造源动作说明；无法确定的细节明确说不知道。不推荐憋气或强忍疼痛。'
      const result=await askHealth({key:await personalKey(),model:h.model,source:data,question:prompt})
      if(useStore.getState().user?.id!==owner)throw new Error('账号已切换，请重新提问')
      setAnswer(result)
      const current=loadHealth()
      saveHealth({...current,guides:[{id:String(exercise.id),exerciseId:exercise.id,text:result,question:prompt,source:data,_ts:Date.now(),createdAt:new Date().toISOString()},...(current.guides||[]).filter(g=>g.exerciseId!==exercise.id)]})
    } catch(e){setError(e.message)} finally{setBusy(false)}
  }
  return <section style={{marginTop:20}}><h4>分步动作助手</h4>{guide&&<div className="card" style={{padding:16}}><h4>{guide.title} · 基础教学</h4><p>{guide.setup}</p><ol>{guide.steps.map(s=><li key={s}>{s}</li>)}</ol><p><strong>呼吸：</strong>{guide.breath}</p><p><strong>参考节奏：</strong>{guide.tempo}</p><p><strong>发力感觉：</strong>{guide.feel}</p><p><strong>降低难度：</strong>{guide.easier}</p></div>}<p className="dim small">结合当前动作、你的基础和身体限制解释；说明不代表已观察你的实际姿势。</p><textarea className="input" style={{width:'100%',minHeight:65}} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="留空生成分步说明，或提问：我只感觉手臂酸怎么办？"/><button className="btn" disabled={busy} onClick={ask}>{busy?'正在生成…':cached?'继续问 / 更新讲解':'讲解当前动作 / 提问'}</button>{error&&<p role="alert">{error}。请在我的 AI 教练中检查配置。</p>}<p style={{whiteSpace:'pre-wrap'}}>{answer||cached?.text}</p>{(source||cached?.source)&&<details><summary>讲解依据（不含图片和完整档案）</summary><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(source||cached.source,null,2)}</pre></details>}</section>
}
