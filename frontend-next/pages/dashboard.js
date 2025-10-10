
import {loadAttempts,progressFromAttempts} from '../lib/session';
import {PieChart,Pie,Cell,ResponsiveContainer,BarChart,XAxis,YAxis,Tooltip,Legend,Bar} from 'recharts';
export default function Dashboard(){
  const attempts=loadAttempts(); const prog=progressFromAttempts(attempts);
  const pie=[{name:'Correct',value:prog.correct},{name:'Incorrect',value:Math.max(0,prog.attempted-prog.correct-prog.skipped)},{name:'Skipped',value:prog.skipped}];
  const chapters=Object.values(attempts.reduce((m,a)=>{m[a.chapter]??={chapter:a.chapter,attempted:0,correct:0};m[a.chapter].attempted++;if(a.correct)m[a.chapter].correct++;return m;},{}));
  const COLORS=['#16a34a','#ef4444','#f59e0b'];
  return(<div className='app'>
    <div className='header'><div className='brand'>Student Dashboard</div><div className='badge'>Preview</div></div>
    <div className='row'>
      <div style={{gridColumn:'span 4'}} className='panel'><h4>Overview</h4><div className='kpis'><div className='kpi'>Attempted: {prog.attempted}</div><div className='kpi'>Correct: {prog.correct}</div><div className='kpi'>Accuracy: {prog.attempted?prog.accuracy:0}%</div><div className='kpi'>Avg time: {prog.avgTime||0}s</div></div></div>
      <div style={{gridColumn:'span 4'}} className='panel'><h4>Outcome Split</h4><div style={{width:'100%',height:220}}><ResponsiveContainer><PieChart><Pie data={pie} dataKey='value' nameKey='name' outerRadius={80} label>{pie.map((e,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}</Pie><Legend/></PieChart></ResponsiveContainer></div></div>
      <div style={{gridColumn:'span 4'}} className='panel'><h4>Accuracy by Chapter</h4><div style={{width:'100%',height:220}}><ResponsiveContainer><BarChart data={chapters}><XAxis dataKey='chapter'/><YAxis/><Tooltip/><Bar dataKey={(d)=>Math.round((d.correct/(d.attempted||1))*100)} name='Accuracy %' /></BarChart></ResponsiveContainer></div></div>
    </div>
    <div className='panel' style={{marginTop:12}}><h4>Recent Attempts</h4><pre>{JSON.stringify(attempts.slice(-10),null,2)}</pre></div>
  </div>);
}
