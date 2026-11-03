import { build } from '../../../api/coach/core/payload.js'
import { runPipeline } from '../../../api/coach/core/pipeline.js'
import compatible from '../../../api/coach/core/adapters/compatible.js'
import { HTTP_PROVIDERS } from '../../../api/coach/core/providers.js'

export function personalPlanPayload(state, profile, options) {
  return build(state, { handle:'personal-device',kind:'create',lang:'zh',intake:{
    goal:profile.goal,experience:options.experience,daysPerWeek:options.days,sessionMin:options.minutes,
    equipment:options.equipment,limitations:profile.limitations,notes:`${profile.background}\n时间及场地：${profile.equipment}`
  } })
}
export async function generatePersonalPlan({state,profile,options,key,model,fetcher}) {
  if(!fetcher){const {nativeFetch}=await import('./capacitor-fetch.js');const {MOBILE}=await import('./mobile.js');fetcher=MOBILE?nativeFetch:fetch}
  if(key && !model?.trim()) throw new Error('请先配置硅基流动模型 ID')
  const payload=personalPlanPayload(state,profile,options)
  let adapter=compatible
  if(!key){
    const {serverCompletion}=await import('./personal-server.js')
    adapter={spawns:false,invoke:async args=>{try{const r=await serverCompletion({prompt:args.prompt,system:args.system,schema:args.schema,maxTokens:8000});return {code:0,text:r.text}}catch(e){return {code:1,stderr:e.message}}}}
  }
  const result=await runPipeline({adapter,cfg:{provider:'compatible',providerOptions:{compatible:{baseUrl:'https://api.siliconflow.cn/v1'}}},kind:'create',payload,model:model?.trim(),timeoutMs:120000,invokeOpts:{env:{[HTTP_PROVIDERS.compatible.apiKeyEnv]:key},fetch:fetcher,maxTokens:8000}})
  if(!result.ok)throw new Error(`计划生成失败：${result.errorClass}。${(result.detail||result.errors?.join('；')||'请检查模型和数据').slice(0,500)}`)
  if(!result.result?.bundle)throw new Error('模型没有提供完整计划')
  return {bundle:{...result.result.bundle,unit:state.unit||'kg'},source:payload}
}
