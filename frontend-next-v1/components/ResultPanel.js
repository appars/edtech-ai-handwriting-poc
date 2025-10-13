
export default function ResultPanel({result}){
  if(!result) return null;
  const title=result.correct?'✅ Correct!':'❌ Try again';
  return(<div className='result'><div style={{fontWeight:800,marginBottom:6}}>{title}</div><pre style={{margin:0}}>{JSON.stringify(result,null,2)}</pre></div>);
}
