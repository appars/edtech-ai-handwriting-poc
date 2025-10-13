
import { useEffect, useMemo, useRef, useState } from "react";
import { loadProfile, createSession, loadSession, saveSession, addAttempt, addSessionSummary } from "../lib/session";
import InkCanvas from "../components/InkCanvas";
import QuestionNavigator from "../components/QuestionNavigator";
export default function Exam(){
  const [mounted,setMounted]=useState(false);
  const [questions,setQuestions]=useState([]);
  const [session,setSession]=useState(null);
  const [answer,setAnswer]=useState("");
  const [result,setResult]=useState(null);
  const canvasRef=useRef(null);
  useEffect(()=>{ setMounted(true); },[]);
  useEffect(()=>{ fetch("/questions.json").then(r=>r.json()).then(setQuestions); },[]);
  useEffect(()=>{
    if(!mounted) return;
    const profile = JSON.parse(localStorage.getItem("ed.v3.profile")||"null");
    if(!profile){ window.location.href="/"; return; }
    let s = JSON.parse(localStorage.getItem("ed.v3.session.current")||"null");
    if(!s){
      const subject = "Mathematics";
      const standard = profile.standard;
      const first = (qs)=> qs.find(q=>q.subject===subject && String(q.standard)===String(standard));
      const f = first(questions)||questions[0];
      if(!f) return;
      s = createSession({subject,standard,chapter:f.chapter,level:f.level,questions,size:5});
    }
    setSession(s);
  },[mounted,questions]);
  const currentQ = useMemo(()=>{ if(!session) return null; const id = session.questions[session.index]; return questions.find(q=>q.id===id) || null; },[session,questions]);
  useEffect(()=>{
    if(!session||!currentQ) return;
    const ans = session.answers[currentQ.id]||{};
    setAnswer(ans.final||"");
    if(ans.inkPng){ try{document.fonts?.ready.then(()=>canvasRef.current?.fromDataURL(ans.inkPng));}catch{canvasRef.current?.fromDataURL(ans.inkPng);} } else { canvasRef.current?.clear(); }
  },[currentQ?.id]);
  async function submit(){
    if(!session||!currentQ) return;
    const png = canvasRef.current?.toDataURL();
    const meta = {
      answer_type: currentQ.answer_type || "numeric",
      expected: currentQ.expected || null,
      expected_numeric: currentQ.numeric_expected ?? null,
      tolerance: currentQ.tolerance ?? (currentQ.level==='Easy'?0.01: currentQ.level==='Medium'?0.001:0)
    };
    let ok=false, feedback="Try again";
    try{
      const r = await fetch((process.env.NEXT_PUBLIC_BACKEND_URL||"http://127.0.0.1:8000")+"/evaluate",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ questionId: currentQ.id, answer, meta })
      });
      const data = await r.json(); ok=!!data.correct; feedback=data.feedback||feedback;
    }catch(e){ feedback="(offline) Submitted locally"; ok = null; }
    const s = {...session};
    s.answers[currentQ.id] = { final: answer, inkPng: png, timeSec: 0, feedback, correct: ok };
    s.statuses[currentQ.id] = ok===true ? "correct" : (ok===false ? "incorrect" : "unseen");
    saveSession(s); setSession(s); setResult({ok,feedback});
  }
  function skip(){ if(!session||!currentQ) return; const s={...session}; s.statuses[currentQ.id]="skipped"; s.answers[currentQ.id] = {...(s.answers[currentQ.id]||{}), final: answer, inkPng: canvasRef.current?.toDataURL(), feedback:"skipped"}; saveSession(s); setSession(s); nextQ(); }
  function nextQ(){ if(!session) return; const s={...session}; const n = Math.min(s.index+1, s.questions.length-1); s.index = n; Object.keys(s.statuses).forEach((id,i)=>{ if(s.questions.indexOf(id)===n) s.statuses[id]="current"; }); saveSession(s); setSession(s); setResult(null); }
  function prevQ(){ if(!session) return; const s={...session}; const n = Math.max(s.index-1, 0); s.index = n; Object.keys(s.statuses).forEach((id,i)=>{ if(s.questions.indexOf(id)===n) s.statuses[id]="current"; }); saveSession(s); setSession(s); setResult(null); }
  async function endSession(){
    if(!session) return;
    const total = session.questions.length;
    const correct = Object.values(session.answers).filter(a=>a.correct===true).length;
    addSessionSummary({ id: session.id, subject: session.subject, standard: session.standard, chapter: session.chapter, level: session.level, total, correct, startedAt: session.startedAt, endedAt: new Date().toISOString(), totalTimeSec: 0 });
    localStorage.removeItem("ed.v3.session.current");
    window.location.href = `/results/${session.id}`;
  }

  // --- Board control handlers (minimal wiring) ---
  function clearBoard(){
    if(!canvasRef.current) return;
    if(!confirm("Clear your working for this question? (Final answer stays)")) return;
    canvasRef.current.clear?.();
  }
  function undoBoard(){
    // Enabled only if InkCanvas exposes undo()
    canvasRef.current?.undo?.();
  }
  function redoBoard(){
    // Enabled only if InkCanvas exposes redo()
    canvasRef.current?.redo?.();
  }
  if(!mounted||!session||!currentQ) return null;
  return (<div className="app">
    <div className="topbar"><div>{session.subject} · Grade {session.standard} · {session.chapter} ({session.level})</div><div>Q {session.index+1}/{session.questions.length}</div></div>
    <div className="panel">
      <div className="prompt"><strong>Prompt:</strong> {currentQ.prompt}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:12}}>
        <div><div className="hint">Write your working below</div><div><InkCanvas ref={canvasRef}/></div></div>
        <div>
          <label className="label">Final Answer</label>
          <input className="input" value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="e.g., 41/35 or 1.1714"/>
          <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
            <button className="btn" onClick={submit}>Submit</button>
            <button className="btn secondary" onClick={skip}>Skip</button>
            <button className="btn secondary" onClick={prevQ}>Prev</button>
            <button className="btn secondary" onClick={nextQ}>Next</button>
            <button className="btn danger" onClick={endSession}>End Session</button>
          </div>
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:12,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:8}}>
          <button type="button" className="btn secondary" onClick={undoBoard} disabled={!canvasRef.current || !canvasRef.current.undo} title="Undo (Ctrl/Cmd+Z)">↶ Undo</button>
          <button type="button" className="btn secondary" onClick={redoBoard} disabled={!canvasRef.current || !canvasRef.current.redo} title="Redo (Ctrl/Cmd+Shift+Z)">↷ Redo</button>
          <button type="button" className="btn secondary" onClick={clearBoard} title="Clear (Ctrl/Cmd+Backspace)">⌫ Clear</button>
        </div>
        <QuestionNavigator queue={session.questions} statuses={session.statuses} currentIndex={session.index} onSelect={(i)=>{const s={...session}; s.index=i; Object.keys(s.statuses).forEach((id,idx)=>{ if(s.questions.indexOf(id)===i) s.statuses[id]="current"; }); saveSession(s); setSession(s);}}/>
      </div>
    </div>
  </div>);
}
