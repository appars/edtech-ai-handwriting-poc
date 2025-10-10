
import {useEffect,useMemo,useRef,useState} from 'react';import {useRouter} from 'next/router';
import {loadSession,saveSession,addAttempt,loadAttempts,progressFromAttempts,loadAnswers,saveAnswers} from '../lib/session';
import QuestionNavigator from '../components/QuestionNavigator';import PromptCard from '../components/PromptCard';
import InkCanvas from '../components/InkCanvas';import ControlsBar from '../components/ControlsBar';import ResultPanel from '../components/ResultPanel';
import ProgressSummary from '../components/ProgressSummary';import Toast from '../components/Toast';import ConfirmModal from '../components/ConfirmModal';
const API=process.env.NEXT_PUBLIC_BACKEND_URL||'http://127.0.0.1:8000';
export default function ExamPage(){
  const router=useRouter(); const[questions,setQuestions]=useState([]); const[session,setSession]=useState(null);
  const[attempts,setAttempts]=useState([]); const[answer,setAnswer]=useState(''); const[busy,setBusy]=useState(false);
  const[result,setResult]=useState(null); const[pqSec,setPqSec]=useState(0); const inkRef=useRef(null); const pqTimer=useRef(null);
  const[toast,setToast]=useState(''); const[showEnd,setShowEnd]=useState(false); const[canNext,setCanNext]=useState(false);
  const[answersMap,setAnswersMap]=useState({});
  useEffect(()=>{const s=loadSession();if(!s){router.replace('/');return;}setSession(s);setAttempts(loadAttempts());setAnswersMap(loadAnswers(s.id));fetch('/questions.json').then(r=>r.json()).then(setQuestions)},[]);
  const currentId=session?.queue?.[session?.index||0]; const currentQ=useMemo(()=>questions.find(q=>q.id===currentId)||null,[questions,currentId]);
  useEffect(()=>{clearInterval(pqTimer.current);setPqSec(0);pqTimer.current=setInterval(()=>setPqSec(s=>s+1),1000);return()=>clearInterval(pqTimer.current)},[currentId]);
  useEffect(()=>{ if(!session||!currentId||!inkRef.current) return; const saved=answersMap[currentId]; if(saved){inkRef.current.fromDataURL(saved.ink||null); setAnswer(saved.text||''); setCanNext(!!saved.submitted||saved.skipped===true);} else {inkRef.current.clear(); setAnswer(''); setCanNext(false);} },[currentId,answersMap,session]);
  useEffect(()=>{ if(!session||!currentId) return; const t=setInterval(()=>{snapshot('autosave')},3000); return()=>clearInterval(t); },[session,currentId,answer]);
  if(!session) return null;
  function updStatus(qid,st){const s={...session,statuses:{...session.statuses,[qid]:st}};setSession(s);saveSession(s);}
  function saveMap(map){setAnswersMap(map);saveAnswers(session.id,map);}
  function snapshot(reason='manual'){try{const img=inkRef.current?.toDataURL();const map={...answersMap,[currentId]:{text:answer,ink:img,ts:Date.now(),reason,submitted:answersMap[currentId]?.submitted||false,skipped:answersMap[currentId]?.skipped||false}};saveMap(map);}catch{}}
  function goto(i){snapshot('goto');const s={...session,index:i};const cid=s.queue[i];if(s.statuses[cid]==='unseen')s.statuses[cid]='current';Object.keys(s.statuses).forEach(id=>{if(id!==cid&&s.statuses[id]==='current')s.statuses[id]='unseen'});setSession(s);saveSession(s);setResult(null);}
  function buildPayload(q,ans){const at=(q.answer_type||'').toLowerCase();const num=/^[0-9./-]+$/.test(ans||''); if((at==='numeric'||at==='numeric_fraction_ok')&&!num)return {error:'Invalid numeric format'}; if(at==='categorical'&&!(ans||'').trim()) return {error:'Empty categorical answer'};
    if(at==='numeric'){return{answer:ans,answer_type:'numeric',numeric_expected:q.numeric_expected??q.expected,tolerance:q.tolerance??0}}
    if(at==='numeric_fraction_ok'){return{answer:ans,answer_type:'numeric_fraction_ok',numeric_expected:q.numeric_expected??q.expected,expected_fraction:q.expected_fraction??null,tolerance:q.tolerance??0}}
    if(at==='categorical'){return{answer:ans,answer_type:'categorical',categorical_expected:q.expected}}
    if(at==='ratio'){return{answer:ans,answer_type:'ratio',expected_ratio:q.expected_ratio}}
    if(at==='algebraic'){return{answer:ans,answer_type:'algebraic',expected_latex:q.expected_latex||q.expected}}
    return{answer:ans,answer_type:q.answer_type||'numeric',expected:q.expected||null,tolerance:q.tolerance||0}
  }
  async function handleSubmit(){if(!currentQ||!answer.trim()){setToast('Please write or type an answer first.');return;}
    const payload=buildPayload(currentQ,answer.trim()); if(payload.error){setToast(payload.error);return;}
    setBusy(true); snapshot('submit');
    try{const res=await fetch(`${API}/check`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const json=await res.json();setResult(json);setToast(json.correct?'✅ Correct!':'❌ Try again');
      const att={attemptId:`att_${Date.now()}`,sessionId:session.id,questionId:currentQ.id,chapter:currentQ.chapter,level:currentQ.level,answer:answer.trim(),correct:!!json.correct,timeTakenSec:pqSec,timestamp:new Date().toISOString(),feedback:json.feedback||''};
      const list=addAttempt(att); setAttempts(list);
      updStatus(currentQ.id,json.correct?'correct':'incorrect');
      const map={...answersMap,[currentId]:{...(answersMap[currentId]||{}),submitted:true}}; saveMap(map); setCanNext(true);
    }catch{setToast('AI service not reachable. Saved locally.');} finally{setBusy(false);}
  }
  function handleSkip(){ snapshot('skip'); const att={attemptId:`att_${Date.now()}`,sessionId:session.id,questionId:currentQ.id,chapter:currentQ.chapter,level:currentQ.level,answer:'',correct:false,timeTakenSec:pqSec,timestamp:new Date().toISOString(),feedback:'skipped'}; const list=addAttempt(att); setAttempts(list); updStatus(currentQ.id,'skipped'); const map={...answersMap,[currentId]:{...(answersMap[currentId]||{}),skipped:true}}; saveMap(map); setCanNext(true); setResult({correct:false,feedback:'skipped'});}
  function handleNext(){ if(session.index<session.queue.length-1){ const s={...session,index:session.index+1}; const cid=s.queue[s.index]; s.statuses[cid]='current'; Object.keys(s.statuses).forEach(id=>{if(id!==cid&&s.statuses[id]==='current')s.statuses[id]='unseen'}); setSession(s); saveSession(s); setResult(null); setToast(''); } else { setShowEnd(true); } }
  const prog=progressFromAttempts(attempts); const overall=Math.round(((session.index)/(session.queue.length||1))*100);
  return(<div className='app'>
    <div className='topbar'><div style={{fontWeight:800,color:'#1d4ed8'}}>Exam Mode</div><div className='kpis'><div className='kpi'>Question {session.index+1}/{session.queue.length}</div><div className='kpi'>Per Q: {pqSec}s</div><button className='btn danger' onClick={()=>setShowEnd(true)}>End Test</button></div></div>
    <div className='row'>
      <div style={{gridColumn:'span 9'}}>
        <PromptCard chapter={currentQ?.chapter} level={currentQ?.level} prompt={currentQ?.prompt} perQuestionSec={pqSec} progress={overall}/>
        <InkCanvas ref={inkRef} width={980} height={460}/>
        <QuestionNavigator queue={session.queue} statuses={session.statuses} currentIndex={session.index} onSelect={goto}/>
        <ControlsBar answer={answer} setAnswer={setAnswer}
          onUndo={()=>inkRef.current?.undo()}
          onClear={()=>{ if((answersMap[currentId]?.ink||'') && !window.confirm('Clear canvas?')) return; inkRef.current?.clear(); }}
          onDownload={()=>{const url=inkRef.current?.toDataURL(); if(!url) return; const a=document.createElement('a');a.href=url;a.download=`answer-${Date.now()}.png`;a.click();}}
          onSubmit={handleSubmit} onSkip={handleSkip} onNext={handleNext}
          canSubmit={!!currentQ} busy={busy} canNext={canNext}/>
        <ResultPanel result={result}/>
      </div>
      <div style={{gridColumn:'span 3'}}><ProgressSummary attempted={prog.attempted} correct={prog.correct} skipped={prog.skipped} accuracy={prog.accuracy} avgTime={prog.avgTime}/></div>
    </div>
    <Toast msg={toast} onClose={()=>setToast('')}/>
    <ConfirmModal open={showEnd} title='End Test?' message={`You attempted ${prog.attempted} of ${session.queue.length}.`} onCancel={()=>setShowEnd(false)} onConfirm={()=>router.push('/dashboard')} confirmText='Submit & View Dashboard'/>
  </div>);
}
