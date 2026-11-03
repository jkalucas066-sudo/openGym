import { api } from './api.js'
export const serverAI = () => api('/api/personal/ai')
export async function saveServerAI(key,model) {
  if(!key.trim()||!model.trim())throw new Error('请填写 Key 和完整模型 ID')
  await api('/api/admin/coach/connect',{method:'POST',body:JSON.stringify({provider:'compatible',type:'apikey',token:key.trim()})})
  await api('/api/admin/coach/config',{method:'POST',body:JSON.stringify({enabled:true,provider:'compatible',model:model.trim(),baseUrl:'https://api.siliconflow.cn/v1'})})
  return serverAI()
}
export const serverCompletion = data => api('/api/personal/completion',{method:'POST',body:JSON.stringify(data),timeout:200000})
