import {loadHealth,saveHealth} from '../lib/personal-state.js'
import {useEffect,useRef,useState} from 'react'
import {useNavigate,useLocation} from 'react-router-dom'
import {useStore} from '../store/useStore.js'
import Icon from '../components/Icon.jsx'
import PersonalPlan from '../components/PersonalPlan.jsx'
import PersonalJournal from '../components/PersonalJournal.jsx'
import {serverAI,saveServerAI} from '../lib/personal-server.js'
import {personalKey,savePersonalKey} from '../lib/personal-key.js'
import {validateHealth,dateKey,closedPeriods,analysisData,computerAnalysisData,askHealth,reportQuestion} from '../lib/personal-health.js'
import {MOBILE,shareExport,shareExportBlob} from '../lib/mobile.js'
import {exportBackupZip} from '../lib/backup-media.js'
import {fetchToStore} from '../lib/media-sync.js'
import '../personal-health.css'

const tools=[['chat','问教练','sparkles'],['plan','制定计划','calendar'],['journal','练后记录','pencil'],['reports','周月复盘','chart'],['profile','个人档案','person'],['ai','AI 设置','gear'],['backup','导出备份','download']]
export default function PersonalHealth(){
  const nav=useNavigate(),location=useLocation(),S=useStore(s=>s.S),user=useStore(s=>s.user)
  const health=S.personal||loadHealth(),file=useRef(null)
  const [panel,setPanel]=useState('chat'),[config,setConfig]=useState(null),[key,setKey]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[question,setQuestion]=useState(''),[reportContext,setReportContext]=useState(null)
  useEffect(()=>{const p=new URLSearchParams(location.search).get('panel');setPanel(tools.some(t=>t[0]===p)?p:'chat')},[location.search])
  useEffect(()=>{let gone=false;serverAI().then(info=>{if(gone)return;setConfig(info);if(info.model&&!loadHealth().model)saveHealth({...loadHealth(),model:info.model})}).catch(()=>{});return()=>{gone=true}},[user?.id])
  function save(next){try{saveHealth(next);return true}catch(e){setStatus(e.message);return false}}
  function go(p){nav('/personal?panel='+p);document.querySelector('.coach-tools')?.removeAttribute('open');window.scrollTo(0,0)}
  async function run(fn){if(busy)return;setBusy(true);setStatus('');const owner=user?.id;try{await fn(()=>{if(useStore.getState().user?.id!==owner)throw new Error('账号已切换，请在当前账号重新操作')})}catch(e){setStatus(e.message)}finally{setBusy(false)}}
  async function download(data,name){
    const blob=data instanceof Blob?data:new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    if(MOBILE){if(data instanceof Blob)await shareExportBlob(blob,name);else await shareExport(await blob.text(),name)}
    else {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
  }
  async function report(period,force=false,check=()=>{}){
    const current=loadHealth(),data=analysisData(useStore.getState().S,current,period)
    if(!data.workouts.length&&!data.journal.length&&!data.bodyweight.length){setStatus('本周期没有记录，先记录后再生成。');return}
    const previous=current.reports.find(r=>r.id===period.id)
    if(previous&&!force)return
    const answer=await askHealth({key:await personalKey(),model:current.model,source:data,question:reportQuestion})
    check();const latest=loadHealth(),at=Date.now(),old=latest.reports.find(r=>r.id===period.id)
    const next={...period,text:answer,source:data,createdAt:new Date().toISOString(),_ts:at,history:old?[{text:old.text,source:old.source,createdAt:old.createdAt},...(old.history||[])]:[]}
    saveHealth({...latest,reports:[next,...latest.reports.filter(r=>r.id!==period.id)]});setStatus('报告已保存')
  }
  const field=(label,value,onChange,type='text')=><label>{label}<input type={type} value={value} onChange={e=>onChange(e.target.value)}/></label>
  const backupDue=!health.lastBackup||Date.now()-new Date(health.lastBackup).getTime()>7*86400000
  return <div className="personal-health narrow" data-active={panel}>
    <div className="hdr"><button className="iconbtn" aria-label="返回首页" onClick={()=>nav('/home')}><Icon name="chevronLeft"/></button><div style={{flex:1}}><h1>{tools.find(t=>t[0]===panel)?.[1]}</h1><div className="sub">{user?.name||'本设备'} · {config?.ready?'已连接 AI':'可配置 AI'}</div></div><details className="coach-tools"><summary aria-label="教练工具"><Icon name="more"/></summary><div>{tools.map(([id,name,icon])=><button key={id} onClick={()=>go(id)}><Icon name={icon}/>{name}</button>)}</div></details></div>
    <section data-panel="profile" className="card"><h2>个人档案</h2><p>用于训练建议；你可以随时修改。</p>{[['goal','目标'],['background','基础情况（年龄、身高、训练基础）'],['equipment','可用器械与时间'],['limitations','旧伤、当前不适与限制']].map(([k,label])=><div key={k}>{field(label,health.profile[k],v=>save({...health,profile:{...health.profile,[k]:v}}))}</div>)}<button onClick={()=>go('plan')}>按档案制定计划</button><button onClick={()=>nav('/measurements')}>身体围度记录</button><button onClick={()=>nav('/settings/data')}>Apple 健康接口</button><button onClick={()=>nav('/settings/watch')}>Apple Watch</button></section>
    <section data-panel="ai" className="card"><h2>硅基流动</h2><p>{config?.ready?`电脑服务已配置：${config.model}`:'填写模型 ID 和 Key，然后测试连接。'}</p>{field('模型 ID',health.model,v=>save({...health,model:v}))}{field('API Key',key,setKey,'password')}<p className="small">Key 单独安全保存，不进入健康档案或备份。手机可单独配置，或配对电脑使用其配置。</p><button disabled={busy} onClick={()=>run(async check=>{if(!key.trim()||!health.model.trim())throw new Error('请填写 Key 和模型 ID');if(user?.admin){const c=await saveServerAI(key,health.model);check();setConfig(c);await savePersonalKey('')}else await savePersonalKey(key);setKey('');setStatus('配置已保存')})}>保存配置</button><button disabled={busy} onClick={()=>run(async check=>{await askHealth({key:await personalKey(),model:health.model,source:{},question:'连接测试，只回答连接成功。'});check();setStatus('真实模型连接成功')})}>测试连接</button></section>
    <div data-panel="plan"><PersonalPlan health={health} onDraftChange={planDraft=>save({...loadHealth(),planDraft})} onProfileChange={profile=>save({...health,profile})}/></div>
    <div data-panel="journal"><PersonalJournal health={health} save={save}/></div>
    <section data-panel="chat" className="card"><h2>今天想问什么？</h2><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="动作怎么发力？今天吃什么？最近恢复得怎么样？"/><div className="coach-shortcuts"><button onClick={()=>go('plan')}>制定训练计划</button><button onClick={()=>go('journal')}>练后记录</button><button onClick={()=>go('reports')}>看复盘</button></div><button disabled={busy||!question.trim()} onClick={()=>run(async check=>{const from=new Date();from.setDate(from.getDate()-6);const end=new Date();end.setDate(end.getDate()+1);const data=analysisData(useStore.getState().S,loadHealth(),{from:dateKey(from),to:dateKey(end)});if(reportContext)data.report=loadHealth().reports.find(r=>r.id===reportContext);data.conversation=(loadHealth().chats||[]).filter(r=>!r.deleted).slice(0,6).reverse().map(r=>({question:r.question,answer:r.text}));const q=question.trim();const answer=await askHealth({key:await personalKey(),model:health.model,source:data,question:q});check();const latest=loadHealth();saveHealth({...latest,chats:[{id:crypto.randomUUID(),question:q,text:answer,source:data,createdAt:new Date().toISOString(),_ts:Date.now()},...(latest.chats||[])]});setQuestion('');setReportContext(null);setStatus('回答已保存')})}>发送</button><p className="small">结合个人档案、最近 7 天记录与最近对话回答；照片不自动发送。</p>{(health.chats||[]).filter(r=>!r.deleted).map(r=><article className="coach-message" key={r.id}><h3>{r.question}</h3><p style={{whiteSpace:'pre-wrap'}}>{r.text}</p><details><summary>查看原始依据 · {new Date(r.createdAt).toLocaleDateString()}</summary><pre>{JSON.stringify({...r.source,conversation:undefined},null,2)}</pre></details></article>)}</section>
    <section data-panel="reports" className="card"><h2>周月复盘</h2><label><input type="checkbox" checked={health.automatic} onChange={e=>save({...health,automatic:e.target.checked})}/>自动生成周报和月报</label><p className="small">开启后将对应周期记录发送给 AI 并消耗额度。电脑服务运行时，即使关闭网页也会补生成上个完整周/月。独立手机在打开或回到 App 时检查。无记录不调用。</p><button disabled={busy} onClick={()=>run(async check=>{for(const p of closedPeriods())await report(p,false,check)})}>检查待生成报告</button>{closedPeriods().map(p=><div className="coach-report-row" key={p.id}><span>{p.kind} · {p.from}</span><button disabled={busy} onClick={()=>{if(health.reports.some(r=>r.id===p.id)&&!confirm('重新调用 AI 并保留上一版报告？'))return;run(check=>report(p,true,check))}}>生成 / 更新</button></div>)}{!health.reports.length&&<p>还没有报告。记录训练或饮食后，复盘会出现在这里。</p>}{health.reports.map(r=><details key={r.id}><summary>{r.kind} · {r.from} 至 {r.to}（不含结束日）</summary><p style={{whiteSpace:'pre-wrap'}}>{r.text}</p><button onClick={()=>{setReportContext(r.id);setQuestion(`请解释${r.kind} ${r.from} 的建议：`);go('chat')}}>追问报告</button><details><summary>原始数据</summary><pre>{JSON.stringify(r.source,null,2)}</pre></details>{(r.history||[]).map((v,i)=><details key={i}><summary>历史版本 · {v.createdAt}</summary><p style={{whiteSpace:'pre-wrap'}}>{v.text}</p><pre>{JSON.stringify(v.source,null,2)}</pre></details>)}</details>)}</section>
    <section data-panel="backup" className="card"><h2>数据备份</h2>{MOBILE&&<label><input type="checkbox" checked={!!S.autoBackup} onChange={e=>useStore.getState().update(s=>{s.autoBackup=e.target.checked})}/>变动后自动备份到手机文件</label>}<p>{backupDue?'距上次导出已超过一周，建议保存一份完整备份。':`上次导出：${new Date(health.lastBackup).toLocaleDateString()}`}</p><button disabled={busy} onClick={()=>run(async()=>{await download(computerAnalysisData(S,health),'个人健康-GPT分析.json');saveHealth({...loadHealth(),lastBackup:new Date().toISOString()});setStatus('分析包已导出；不含图片、Key 和账号密码')})}>导出电脑分析包</button><button disabled={busy} onClick={()=>run(async()=>{const {blob,missing}=await exportBackupZip(useStore.getState().S,{fetchOne:fetchToStore});await download(blob,'个人健身完整备份.zip');saveHealth({...loadHealth(),lastBackup:new Date().toISOString()});setStatus(missing?`备份已导出，但有 ${missing} 个媒体文件未能取得，请联网后重新导出。`:'完整备份已导出，包含训练、个人档案、报告及本机可取得的照片视频。')})}>导出完整备份</button><button onClick={()=>nav('/settings/data')}>恢复完整备份</button><details><summary>兼容旧版个人档案</summary><button onClick={()=>file.current.click()}>导入旧档案文件</button><input ref={file} type="file" accept="application/json" hidden onChange={async e=>{try{const selected=e.target.files[0];if(!selected)return;const h=validateHealth(JSON.parse(await selected.text()));if(confirm('用此文件替换个人档案及报告？训练记录保留。'))save(h)}catch(e){setStatus(e.message)}finally{e.target.value=''}}}/></details><p className="small">完整备份可通过 iPhone 分享菜单存到“文件”或传给电脑。Key 单独配置，不随备份导出。</p></section>
    <p role="status">{busy?'正在处理，请稍候…':status}</p>
  </div>
}
