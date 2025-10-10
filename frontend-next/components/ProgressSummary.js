
export default function ProgressSummary({attempted=0,correct=0,skipped=0,accuracy=0,avgTime=0}){
  return(<div className='panel'>
    <div style={{fontWeight:800,color:'#1d4ed8',marginBottom:8}}>Progress & Session Summary</div>
    <div className='kpis'>
      <div className='kpi'>Attempted: {attempted}</div>
      <div className='kpi'>Correct: {correct}</div>
      <div className='kpi'>Skipped: {skipped}</div>
      <div className='kpi'>Accuracy: {attempted?accuracy:0}%</div>
      <div className='kpi'>Avg time: {avgTime||0}s</div>
    </div>
  </div>);
}
