import { MOBILE } from './mobile.js'
import { secureGet, secureSet } from './coach-secrets.js'
let webKey = null
export const personalKey = () => MOBILE ? secureGet('personal.siliconflow') : Promise.resolve(webKey)
export async function savePersonalKey(value) {
  if (MOBILE) await secureSet('personal.siliconflow',value)
  else webKey = value.trim() || null
}
