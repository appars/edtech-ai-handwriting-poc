// pages/exam.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { loadSession, saveSession, addAttempt, loadAttempts, progressFromAttempts } from '../lib/session';
import QuestionNavigator from '../components/QuestionNavigator';
import PromptCard from '../components/PromptCard';
import InkCanvas from '../components/InkCanvas';
import ControlsBar from '../components/ControlsBar';
import ResultPanel from '../components/ResultPanel';
import ProgressCard from '../components/ProgressCard';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';

export default function ExamPage(){
  const router = useRouter();
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [pqSec, setPqSec] = useState(0);

  const inkRef = useRef(null);
  const pqTimer = useRef(null);

  useEffect(()=>{
    const sess = loadSession();
    if(!sess){ router.replace('/'); return; }
    setSession(sess);
    setAttempts(loadAttempts());
    fetch('/questions.json').then(r=>r.json()).then(setQuestions).catch(console.error);
  }, []);

  const currentId = session?.queue?.[session?.index || 0];
  const currentQ = useMemo(()=> questions.find(q=>q.id===currentId) || null, [questions, currentId]);

  useEffect(()=>{
    clearInterval(pqTimer.current); setPqSec(0);
    pqTimer.current = setInterval(()=> setPqSec(s=>s+1), 1000);
    return ()=> clearInterval(pqTimer.current);
  }, [currentId]);

  if(!session) return null;

  function updateStatus(qid, st){
    const s = { ...session, statuses: { ...session.statuses, [qid]: st } };
    setSession(s); saveSession(s);
  }

  function goto(i){
    const s = { ...session, index: i };
    const cid = s.queue[i];
    if(s.statuses[cid] === 'unseen') s.statuses[cid] = 'current';
    Object.keys(s.statuses).forEach(id => { if(id!==cid && s.statuses[id]==='current') s.statuses[id]='unseen'; });
    setSession(s); saveSession(s);
    setResult(null); setAnswer('');
  }

  function buildPayload(q, ans){
    const at = (q.answer_type||'').toLowerCase();
    if(at==='numeric'){
      return { answer: ans, answer_type:'numeric', numeric_expected: q.numeric_expected ?? q.expected, tolerance: q.tolerance ?? 0 };
    }
    if(at==='numeric_fraction_ok'){
      return { answer: ans, answer_type:'numeric_fraction_ok', numeric_expected: q.numeric_expected ?? q.expected, expected_fraction: q.expected_fraction ?? null, tolerance: q.tolerance ?? 0 };
    }
    if(at==='categorical'){
      return { answer: ans, answer_type:'categorical', categorical_expected: q.expected };
    }
    if(at==='ratio'){
      return { answer: ans, answer_type:'ratio', ratio_expected: q.expected_ratio ?? q.expected };
    }
    return { answer: ans, answer_type: at || 'unknown' };
  }

  async function handleSubmit(){
    if(!currentQ || !answer.trim()) return;
    setBusy(true);
    try{
      const payload = buildPayload(currentQ, answer.trim());
      const res = await fetch(`${API_URL}/check`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const json = await res.json(); setResult(json);
      const attempt = { attemptId:`att_${Date.now()}`, sessionId:session.id, questionId:currentQ.id, chapter:currentQ.chapter, level:currentQ.level, answer:answer.trim(), correct:!!json.correct, timeTakenSec:pqSec, timestamp:new Date().toISOString(), feedback:json.feedback };
      const list = addAttempt(attempt); setAttempts(list);
      updateStatus(currentQ.id, json.correct ? 'correct' : 'incorrect');
    }catch(e){ console.error(e); setResult({ correct:false, feedback:'Server error.' }); }
    finally{ setBusy(false); }
  }

  function handleSkip(){
    if(!currentQ) return;
    const attempt = { attemptId:`att_${Date.now()}`, sessionId:session.id, questionId:currentQ.id, chapter:currentQ.chapter, level:currentQ.level, answer:'', correct:false, timeTakenSec:pqSec, timestamp:new Date().toISOString(), feedback:'skipped' };
    const list = addAttempt(attempt); setAttempts(list); updateStatus(currentQ.id, 'skipped'); handleNext();
  }

  function handleNext(){
    if(session.index < session.queue.length - 1){
      const s = { ...session, index: session.index + 1 };
      const cid = s.queue[s.index]; s.statuses[cid] = 'current';
      Object.keys(s.statuses).forEach(id => { if(id!==cid && s.statuses[id]==='current') s.statuses[id]='unseen'; });
      setSession(s); saveSession(s); setResult(null); setAnswer('');
    } else { router.push('/dashboard'); }
  }

  const prog = progressFromAttempts(attempts);

  return (
    <div className='app'>
      <div className='topbar'>
        <div style={{fontWeight:800, color:'#1d4ed8'}}>Exam Mode</div>
        <div className='kpis'>
          <div className='kpi'>Question {session.index+1} / {session.queue.length}</div>
          <div className='kpi'>Per Q: {pqSec}s</div>
          <button className='btn secondary' onClick={()=>router.push('/')}>End Test</button>
        </div>
      </div>

      <div className='row'>
        <div style={{ gridColumn:'span 3' }}>
          <QuestionNavigator queue={session.queue} statuses={session.statuses} currentIndex={session.index} onSelect={goto} />
          <div style={{height:12}} />
          <ProgressCard attempted={prog.attempted} correct={prog.correct} skipped={prog.skipped} accuracy={prog.accuracy} />
        </div>

        <div style={{ gridColumn:'span 6' }}>
          <PromptCard chapter={currentQ?.chapter} level={currentQ?.level} prompt={currentQ?.prompt} perQuestionSec={pqSec} />
          <InkCanvas ref={inkRef} width={900} height={420} />
          <ControlsBar answer={answer} setAnswer={setAnswer}
            onUndo={()=>inkRef.current?.undo()} onClear={()=>inkRef.current?.clear()}
            onDownload={()=>{ const url=inkRef.current?.toDataURL(); if(!url) return; const a=document.createElement('a'); a.href=url; a.download=`answer-${Date.now()}.png`; a.click(); }}
            onSubmit={handleSubmit} onSkip={handleSkip} onNext={handleNext}
            canSubmit={!!answer.trim() && !!currentQ} busy={busy}
          />
          <ResultPanel result={result} />
        </div>

        <div style={{ gridColumn:'span 3' }}>
          <div className='panel'>
            <div style={{fontWeight:800, color:'#1d4ed8', marginBottom:8}}>Session Summary</div>
            <div className='kpis'>
              <div className='kpi'>Attempted: {prog.attempted}</div>
              <div className='kpi'>Correct: {prog.correct}</div>
              <div className='kpi'>Accuracy: {prog.accuracy}%</div>
              <div className='kpi'>Skipped: {prog.skipped}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
