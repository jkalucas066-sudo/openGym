import { it, expect } from 'vitest'
import { personalPlanPayload, generatePersonalPlan } from './personal-plan.js'
const state={unit:'kg',routines:[],week:{},workouts:[],bodyweight:[]}
const profile={goal:'恢复训练',background:'久未运动',equipment:'在家',limitations:'肘部旧伤'}
const options={days:2,minutes:25,experience:'beginner',equipment:['body weight']}
it('sends the personal limitations and explicit equipment to the existing planning pipeline',()=>{
  const data=personalPlanPayload(state,profile,options)
  expect(data.coachProfile.limitations).toBe(profile.limitations)
  expect(data.coachProfile.daysPerWeek).toBe(2)
  expect(data.library.length).toBeGreaterThan(0)
})
it('returns a validated plan without modifying the existing training data',async()=>{
  const ids=personalPlanPayload(state,profile,options).library.slice(0,3).map(e=>e.id)
  const plan={coach_contract:1,opengym_plan:1,name:'测试计划',summary:'从少量训练开始',week:{1:'r1',4:'r2'},customEx:[],routines:['r1','r2'].map(id=>({id,name:id,prog:'off',ex:ids.map(id=>({id,sets:2,reps:8,mode:'reps',prog:'off'}))}))}
  const output=await generatePersonalPlan({state,profile,options,key:'test',model:'test',fetcher:async()=>({ok:true,status:200,text:async()=>JSON.stringify({choices:[{finish_reason:'stop',message:{content:JSON.stringify(plan)}}]})})})
  expect(output.bundle.routines).toHaveLength(2)
  expect(state.routines).toEqual([])
})
