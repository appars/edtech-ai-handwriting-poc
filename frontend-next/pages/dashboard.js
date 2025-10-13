
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import questions from "../public/questions.json";
import { loadProfile } from "../lib/session";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const COLORS = { correct: "#16a34a", incorrect: "#ef4444", skipped: "#f59e0b", trend: "#4f46e5" };

export default function Dashboard(){
  const [profile,setProfile]=useState(null);
  const [sessions,setSessions]=useState([]);
  const [attempts,setAttempts]=useState([]);
  const [filter, setFilter] = useState({ subject: "All", chapter: "All", level: "All" });

  useEffect(()=>{
    const p = loadProfile(); if(!p){window.location.href="/"; return;}
    setProfile(p);
    try{
      const s=JSON.parse(localStorage.getItem("ed.v3.sessions")||"[]");
      const a=JSON.parse(localStorage.getItem("ed.v3.attempts")||"[]");
      setSessions(s); setAttempts(a);
    }catch{}
  },[]);

  function doLogout(){
    try{
      localStorage.removeItem("ed.v3.profile");
      localStorage.removeItem("ed.v3.sessions");
      localStorage.removeItem("ed.v3.session.current");
      localStorage.removeItem("ed.v3.attempts");
    }catch{}
    if (typeof window !== "undefined") window.location.href = "/";
  }

  const latest = sessions.length ? sessions[sessions.length-1] : null;

  const filtered = sessions.filter(s=>{
    const okSub = filter.subject==="All" || s.subject===filter.subject;
    const okChap = filter.chapter==="All" || s.chapter===filter.chapter;
    const okLvl = filter.level==="All" || s.level===filter.level;
    return okSub && okChap && okLvl;
  });

  const kpi = (()=>{
    const total = filtered.length;
    if(!total) return { attempts:0, avgAcc:0, avgTimeQ:0, streak:0 };
    const sumAcc = filtered.reduce((a,s)=>a + (100*(s.correct||0)/(s.total||1)),0);
    const sumQ = filtered.reduce((a,s)=>a + (s.total||0),0);
    const sumTime = filtered.reduce((a,s)=>a + (s.totalTimeSec||0),0);
    let streak=0;
    for(let i=filtered.length-1;i>=0;i--){
      const s=filtered[i]; const acc = 100*(s.correct||0)/(s.total||1);
      if(acc>=60) streak++; else break;
    }
    return { attempts: total, avgAcc: Math.round(sumAcc/total), avgTimeQ: sumQ? Math.round(sumTime/sumQ) : 0, streak };
  })();

  const trend = filtered.slice(-12).map(s=>({ 
    t: new Date(s.endedAt||s.startedAt).toLocaleDateString(),
    acc: Math.round(100*(s.correct||0)/(s.total||1))
  }));

  const byChapter = Object.values(filtered.slice(-20).reduce((m,s)=>{
    const k=s.chapter; m[k]=m[k]||{ chapter:k, correct:0, incorrect:0, skipped:0 };
    const correct = s.correct||0;
    const skipped = s.skipped||0;
    const incorrect = Math.max(0,(s.total||0)-correct-skipped);
    m[k].correct+=correct; m[k].incorrect+=incorrect; m[k].skipped+=skipped;
    return m;
  },{}));

  const subjects = ["All", ...new Set(questions.map(q=>q.subject))];
  const chapters = ["All", ...new Set(questions.map(q=>q.chapter))];
  const levels = ["All", ...new Set(questions.map(q=>q.level))];

  return (
    <div className="container mx-auto p-4">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur mb-3">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            {profile && <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">Hi, {profile.name || "Student"} · Grade {profile.standard}</span>}
          </div>
          <div className="flex gap-2">
            <a className="btn btn-secondary" href="/practice/new">Start New Practice</a>
            <button className="btn btn-outline" onClick={doLogout}>Logout</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pb-2">
          <select className="border rounded p-2" value={filter.subject} onChange={e=>setFilter(f=>({...f,subject:e.target.value}))}>
            {subjects.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="border rounded p-2" value={filter.chapter} onChange={e=>setFilter(f=>({...f,chapter:e.target.value}))}>
            {chapters.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
          <select className="border rounded p-2" value={filter.level} onChange={e=>setFilter(f=>({...f,level:e.target.value}))}>
            {levels.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl p-4 shadow bg-white"><div className="text-sm text-gray-500">Attempts</div><div className="text-2xl font-semibold">{kpi.attempts}</div></div>
        <div className="rounded-2xl p-4 shadow bg-white"><div className="text-sm text-gray-500">Avg. Accuracy</div><div className="text-2xl font-semibold">{kpi.avgAcc}%</div></div>
        <div className="rounded-2xl p-4 shadow bg-white"><div className="text-sm text-gray-500">Avg. Time / Q</div><div className="text-2xl font-semibold">{kpi.avgTimeQ}s</div></div>
        <div className="rounded-2xl p-4 shadow bg-white"><div className="text-sm text-gray-500">Streak (≥60%)</div><div className="text-2xl font-semibold">{kpi.streak}</div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl p-3 shadow bg-white">
          <div className="text-sm font-medium mb-2">Latest Exam</div>
          <div style={{width:"100%", height:240}}>
            <ResponsiveContainer>
              {latest && latest.total>0 ? (
                <PieChart>
                  <Tooltip />
                  <Pie dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}
                    data={[
                      {name:"correct", value: latest.correct||0, color: COLORS.correct},
                      {name:"incorrect", value: Math.max(0,(latest.total||0)-(latest.correct||0)-(latest.skipped||0)), color: COLORS.incorrect},
                      {name:"skipped", value: latest.skipped||0, color: COLORS.skipped},
                    ]}>
                    <Cell fill={COLORS.correct} />
                    <Cell fill={COLORS.incorrect} />
                    <Cell fill={COLORS.skipped} />
                  </Pie>
                </PieChart>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">No sessions yet</div>
              )}
            </ResponsiveContainer>
          </div>
          {latest && (
            <div className="text-xs text-gray-600 mt-2">Grade {latest.standard} · {latest.subject} · {latest.chapter} — {latest.correct}/{latest.total} ({Math.round(100*(latest.correct||0)/(latest.total||1))}%)</div>
          )}
        </div>

        <div className="rounded-2xl p-3 shadow bg-white">
          <div className="text-sm font-medium mb-2">Accuracy Trend</div>
          <div style={{width:"100%", height:240}}>
            <ResponsiveContainer>
              <LineChart data={trend}>
                <XAxis dataKey="t" /><YAxis domain={[0,100]} /><Tooltip />
                <Line type="monotone" dataKey="acc" stroke={COLORS.trend} strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl p-3 shadow bg-white">
          <div className="text-sm font-medium mb-2">Accuracy by Chapter (recent)</div>
          <div style={{width:"100%", height:240}}>
            <ResponsiveContainer>
              <BarChart data={byChapter}>
                <XAxis dataKey="chapter" hide /><YAxis />
                <Tooltip />
                <Bar dataKey="correct" stackId="a" fill={COLORS.correct} />
                <Bar dataKey="incorrect" stackId="a" fill={COLORS.incorrect} />
                <Bar dataKey="skipped" stackId="a" fill={COLORS.skipped} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-3 shadow bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b"><th className="p-2">ID</th><th className="p-2">Details</th><th className="p-2">Score</th><th className="p-2">Time</th><th className="p-2">When</th><th className="p-2"></th></tr></thead>
            <tbody>
              {filtered.map((s,idx)=>(
                <tr key={s.id||idx} className="border-b hover:bg-gray-50">
                  <td className="p-2">{s.id}</td>
                  <td className="p-2">{s.subject} · Grade {s.standard} · {s.chapter} ({s.level})</td>
                  <td className="p-2">{s.correct}/{s.total} ({Math.round(100*(s.correct||0)/(s.total||1))}%)</td>
                  <td className="p-2">{s.totalTimeSec||0}s</td>
                  <td className="p-2">{new Date(s.endedAt||s.startedAt).toLocaleString()}</td>
                  <td className="p-2"><Link href={`/results/${s.id}`}>View</Link></td>
                </tr>
              ))}
              {!filtered.length && <tr><td className="p-2" colSpan="6">No sessions yet. <a className="underline" href="/practice/new">Start a practice</a></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
