
export default function PromptCard({chapter,level,prompt,perQuestionSec=0,progress=0}){
  return(<div>
    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
      <span className="badge" style={{background:'#eff6ff',color:'#1e40af'}}>{chapter||'Select Chapter'}</span>
      <span className="badge" style={{background:'#d1fae5',color:'#065f46'}}>{level||'Level'}</span>
      <span className="kpi">Time: {perQuestionSec}s</span>
    </div>
    <div className="progressbar"><div style={{width:progress+'%'}}/></div>
    {prompt?<div className="prompt"><strong>Prompt:</strong> {prompt}</div>:<div className="hint">Pick a question to begin.</div>}
  </div>)
}
