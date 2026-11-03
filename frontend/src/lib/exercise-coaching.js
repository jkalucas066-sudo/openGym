// Authored starting cues, not claims about observing the user's form. The catalogue stays authoritative.
const guides=[
  {match:/^(push[- ]?up|push-up \(male\))$/i,title:'俯卧撑',setup:'手略宽于肩，撑住地面，头、躯干与腿尽量保持一线。先收紧腹部，肩膀远离耳朵。',steps:['慢慢屈肘下放，手肘斜向身体后方，避免完全横着张开。','在可控制、没有关节疼痛的范围内下降。','用手掌推地，胸部与上臂后侧共同用力，身体整体抬起。'],breath:'下放吸气，推起呼气；不必憋气。',tempo:'下放约 2 秒，短暂停顿，再用约 1 秒推起。先保证控制，不追求速度。',feel:'通常胸部、肱三头肌和腹部紧张。发力感不等于动作一定正确；肘或肩刺痛应停止。',easier:'做不稳时改成墙壁或稳固高台俯卧撑，降低难度。'},
  {match:/^(bodyweight squat|body weight squat|squat)$/i,title:'自重深蹲',setup:'双脚约肩宽，脚尖自然微向外，脚掌三点（脚跟、拇趾根、小趾根）接触地面。',steps:['腹部轻轻收紧，髋部向后、向下坐。','膝盖顺着脚尖方向移动，保持脚跟落地，下降到自己可控制的深度。','用整个脚掌推地站起，不必在顶部猛顶膝盖。'],breath:'下蹲吸气，站起呼气。',tempo:'下降约 2–3 秒，底部可控停顿，站起约 1–2 秒。',feel:'大腿前侧和臀部共同用力；腰部不应成为主要疲劳位置。',easier:'在稳固椅子前练坐下、站起，先减小幅度。'},
  {match:/^(front plank|plank|elbow plank)$/i,title:'平板支撑',setup:'双肘在肩下，前臂撑地，双脚向后伸直。保持后脑、背和臀部尽量一线。',steps:['轻轻收腹、夹臀，避免塌腰或抬臀。','持续推离地面，颈部放松，视线看向地面。','姿势开始失控就结束本组；无需硬撑到计时结束。'],breath:'持续自然呼吸，可缓慢吸 2–3 秒、呼 2–3 秒，不屏气。',tempo:'先尝试能稳定维持的 15–30 秒；具体时长按训练计划。',feel:'腹部和臀部有持续紧张感；下背疼痛时停止并调整。',easier:'膝盖落地或前臂撑在稳定高台，减少负荷。'},
  {match:/^(glute bridge|bridge - hip lift|butt bridge|hip bridge)$/i,title:'臀桥',setup:'仰卧屈膝，双脚平放、约髋宽，脚跟距臀部以舒适为准。腹部轻轻收紧。',steps:['脚跟和脚掌共同向地面施力，缓慢抬起骨盆。','抬到肩、髋和膝大致成斜线即可，不用腰向上顶。','臀部保持用力，慢慢下放。'],breath:'抬起呼气，下放吸气。',tempo:'抬起约 1–2 秒，顶部停约 1 秒，下放约 2 秒。',feel:'以臀部为主，大腿后侧也可能参与。腰部挤压感说明幅度或姿势需调整。',easier:'减小幅度，不加重量；先练骨盆轻微后倾。'},
  {match:/^(bird dog|bird-dog)$/i,title:'鸟狗式',setup:'四点跪姿，手在肩下，膝在髋下。腹部轻轻收紧，背部保持自然位置。',steps:['一侧手臂向前、对侧腿向后伸长，不追求抬高。','保持骨盆朝下，避免身体扭转或塌腰。','收回，再换另一侧。'],breath:'伸展时呼气，收回时吸气，过程中继续自然呼吸。',tempo:'伸展约 2 秒，保持约 2 秒，收回约 2 秒。',feel:'躯干保持稳定，臀部参与；下背不应被挤压。',easier:'先只抬一只手，或只向后伸一条腿。'}
]
export const coachingFor=exercise=>{
  const name=exercise?.n==='glute bridge two legs on floor'?'glute bridge':exercise?.n==='air squat'?'squat':exercise?.n
  return guides.find(g=>g.match.test(name||''))||null
}
