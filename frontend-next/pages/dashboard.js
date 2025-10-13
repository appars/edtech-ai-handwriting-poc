
import { useEffect, useMemo, useState } from "react";
import { loadProfile, logout, addSessionSummary, sessionsLog } from "../lib/session";
import Link from "next/link";
export default function Dashboard(){
  const [mounted,setMounted]=useState(false);
  const [profile,setProfile]=useState(null);
  const [attempts,setAttempts]=useState([]);
  const [sessions,setSessions]=useState([]);
  useEffect(()=>{
    setMounted(true);
    const p = loadProfile(); if(!p){window.location.href="/"; return;}
    setProfile(p);
    try{ const a=JSON.parse(localStorage.getItem("ed.v3.attempts")||"[]"); setAttempts(a);
         const s=JSON.parse(localStorage.getItem("ed.v3.sessions")||"[]"); setSessions(s);}catch{}
  },[]);
  const accuracy = useMemo(()=>{ if(!attempts.length) return 0; const c=attempts.filter(a=>a.correct).length; return Math.round(100*c/attempts.length);},[attempts]);
  if(!mounted||!profile) return null;
  return (<div className="app">
    <div className="header">
      <div className="brand">Dashboard</div>
      <div style={{display:'flex',gap:10,alignItems:'center'}}>
        <div className="badge">{profile.name} · Grade {profile.standard}</div>
        <button className="btn secondary" onClick={()=>{ if(confirm("Logout?")){logout(); window.location.href="/";}}}>Logout</button>
      </div>
    </div>
    <div className="panel">
      <div className="kpis">
        <div className="kpi">Attempts: {attempts.length}</div>
        <div className="kpi">Accuracy: {accuracy}%</div>
        <div className="kpi">Sessions: {sessions.length}</div>
      </div>
      <div style={{display:'flex',gap:12,marginTop:12,flexWrap:'wrap'}}>
        <Link className="btn" href="/exam">Start New Practice</Link>
        <Link className="btn secondary" href="/results/all">View All Results</Link>
      </div>
    </div>
    <div style={{marginTop:12}}>
      <h3>Recent Sessions</h3>
      <table className="table">
        <thead><tr><th>Session</th><th>Context</th><th>Score</th><th>Duration</th><th>When</th><th></th></tr></thead>
        <tbody>
          {sessions.map((s)=>(
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.subject} · Grade {s.standard} · {s.chapter} ({s.level})</td>
              <td>{s.correct}/{s.total} ({Math.round(100*s.correct/s.total)}%)</td>
              <td>{s.totalTimeSec||0}s</td>
              <td>{new Date(s.endedAt||s.startedAt).toLocaleString()}</td>
              <td><Link href={`/results/${s.id}`}>View</Link></td>
            </tr>
          ))}
          {!sessions.length && <tr><td colSpan="6">No sessions yet. Start a practice!</td></tr>}
        </tbody>
      </table>
    </div>
  </div>);
}
