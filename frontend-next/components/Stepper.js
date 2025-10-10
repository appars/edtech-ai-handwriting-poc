// components/Stepper.js
export default function Stepper({ step = 1 }){
  const steps=[{n:1,label:'Choose Chapter'},{n:2,label:'Choose Difficulty'},{n:3,label:'Start Practice'}];
  return (<div style={{display:'flex',gap:10,marginBottom:12}}>{steps.map(s=>(
    <div key={s.n} style={{padding:'8px 10px',borderRadius:10,border:'1px solid var(--stroke)',background:s.n===step?'#dbeafe':'#f8fafc',color:s.n===step?'#1d4ed8':'#475569',fontWeight:700,minWidth:140,textAlign:'center'}}>
      {s.n}. {s.label}
    </div>
  ))}</div>);
}
