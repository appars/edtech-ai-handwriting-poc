// components/ProgressCard.js
export default function ProgressCard({ attempted=0, correct=0, skipped=0, accuracy=0 }){
  return (
    <div className='panel' style={{padding:12}}>
      <div style={{fontWeight:800, color:'#1d4ed8', marginBottom:8}}>Progress</div>
      <div className='kpis'>
        <div className='kpi'>Attempted: {attempted}</div>
        <div className='kpi'>Correct: {correct}</div>
        <div className='kpi'>Skipped: {skipped}</div>
        <div className='kpi'>Accuracy: {accuracy}%</div>
      </div>
    </div>
  );
}
