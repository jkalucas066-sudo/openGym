import { describe, it, expect } from 'vitest'
import { closedPeriods, analysisData, blankHealth, askHealth, validateHealth } from './personal-health.js'
describe('personal reports and data boundaries',()=>{
  it('uses completed periods across year boundaries in local time',()=>{
    expect(closedPeriods(new Date(2027,0,1,10))).toEqual([
      {kind:'周报',from:'2026-12-21',to:'2026-12-28',id:'周报:2026-12-21'},
      {kind:'月报',from:'2026-12-01',to:'2027-01-01',id:'月报:2026-12-01'}])
  })
  it('filters by actual date and excludes credentials and media',()=>{
    const h=blankHealth();h.journal=[{date:'2026-10-31',text:'补录',recordedAt:'2026-11-03'},{date:'2026-11-01',text:'other'}]
    const data=analysisData({apiKey:'secret',workouts:[{d:'2026-10-31',media:['photo'],entries:[{id:'1',media:'photo',sets:[{w:5,r:8,done:true,secret:'hidden'}]}]},{d:'2026-11-01'}]},h,{from:'2026-10-01',to:'2026-11-01'})
    expect(data.workouts).toHaveLength(1);expect(data.journal).toHaveLength(1)
    expect(JSON.stringify(data)).not.toMatch(/secret|photo|hidden/)
  })
  it('rejects a broken backup and strips unknown top-level fields',()=>{
    expect(()=>validateHealth({version:1})).toThrow()
    expect(validateHealth({...blankHealth(),apiKey:'secret'}).apiKey).toBeUndefined()
  })
  it('sends the configured model and rejects bad provider replies',async()=>{
    let sent
    const text=await askHealth({key:'test',model:'test-model',source:{},question:'复盘',fetcher:async(url,opts)=>{sent=JSON.parse(opts.body);return {ok:true,json:async()=>({choices:[{message:{content:'报告'}}]})}}})
    expect(text).toBe('报告');expect(sent.model).toBe('test-model')
    await expect(askHealth({key:'test',model:'m',source:{},question:'x',fetcher:async()=>({ok:true,json:async()=>({})})})).rejects.toThrow('未返回')
  })
})
