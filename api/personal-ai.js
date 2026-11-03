import * as cfgStore from './coach/config.js';
import { adapterFor } from './coach/adapters/index.js';
const running=new Set(), usage=new Map();
const fail=(status,message,errorClass)=>Object.assign(new Error(message),{status,errorClass});
export async function completePersonal(uid,body) {
  const cfg=cfgStore.load(),credential=cfgStore.credentialFor(uid),adapter=adapterFor(cfg.provider);
  if(!cfgStore.isEnabled()||cfg.provider==='fixture'||adapter?.spawns!==false||!credential.ok)throw fail(409,'请在 AI 设置中连接真实模型');
  if(typeof body.prompt!=='string'||body.prompt.length>300000||typeof body.system!=='string'||body.system.length>100000)throw fail(400,'请求内容格式或长度不正确');
  const day=new Date().toISOString().slice(0,10),limit=cfg.caps?.perProfileDaily||20;
  const used=usage.get(uid)?.day===day?usage.get(uid).used:0;
  if(running.has(uid))throw fail(409,'上一次 AI 请求尚未结束');
  if(used>=limit)throw fail(429,'今天个人助手调用次数已达上限');
  usage.set(uid,{day,used:used+1});running.add(uid);
  try{
    const r=await adapter.invoke({cfg,prompt:body.prompt,system:body.system,schema:body.schema||null,model:cfgStore.modelFor(cfg),timeoutMs:180000,maxTokens:Math.min(8000,Math.max(512,Number(body.maxTokens)||2400)),env:cfgStore.jobEnv('',credential)});
    if(r.code!==0)throw fail(502,r.timedOut?'模型等待超时，请稍后再试':'模型请求失败，请检查额度、模型和连接测试',r.timedOut?'timeout':'provider');
    return {text:r.text,model:cfgStore.modelFor(cfg)};
  }finally{running.delete(uid)}
}
