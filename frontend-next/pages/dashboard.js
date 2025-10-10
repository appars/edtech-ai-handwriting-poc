// pages/dashboard.js
import { loadAttempts, progressFromAttempts } from '../lib/session';
export default function Dashboard(){
  const attempts = loadAttempts(); const prog = progressFromAttempts(attempts);
  return (<div className='app'>
    <div className='header'><div className='brand'>Student Dashboard (Preview)</div><div className='badge'>Coming next</div></div>
    <div className='panel'><div style={{fontWeight:800,color:'#1d4ed8',marginBottom:8}}>Summary</div>
      <div className='kpis'><div className='kpi'>Attempted: {prog.attempted}</div><div className='kpi'>Correct: {prog.correct}</div><div className='kpi'>Accuracy: {prog.accuracy}%</div><div className='kpi'>Skipped: {prog.skipped}</div></div>
    </div>
    <div style={{height:12}}/>
    <div className='panel'><div style={{fontWeight:800,color:'#1d4ed8',marginBottom:8}}>Recent Attempts</div><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(attempts.slice(-10), null, 2)}</pre></div>
  </div>);
}
