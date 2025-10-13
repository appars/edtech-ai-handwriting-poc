
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
export default function Results(){
  const r = useRouter();
  const { sessionId } = r.query;
  const [session,setSession]=useState(null);
  useEffect(()=>{ if(!sessionId) return;
    const list = JSON.parse(localStorage.getItem("ed.v3.sessions")||"[]");
    const s = list.find(x=>String(x.id)===String(sessionId)); setSession(s||null);
  },[sessionId]);
  if(!session) return null;
  return (<div className="app">
    <div className="header"><div className="brand">Results</div><a className="btn secondary" href="/dashboard">Back to Dashboard</a></div>
    <div className="panel">
      <div className="kpis">
        <div className="kpi">{session.subject} · Grade {session.standard} · {session.chapter} ({session.level})</div>
        <div className="kpi">Score: {session.correct}/{session.total} ({Math.round(100*session.correct/session.total)}%)</div>
        <div className="kpi">Duration: {session.totalTimeSec||0}s</div>
        <div className="kpi">Ended: {new Date(session.endedAt).toLocaleString()}</div>
      </div>
    </div>
  </div>);
}
