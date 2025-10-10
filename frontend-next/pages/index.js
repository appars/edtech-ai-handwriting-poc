// pages/index.js (Login/Setup)
import { useEffect, useMemo, useState } from 'react';
import Stepper from '../components/Stepper';
import { storage } from '../lib/storage';
import { createSession } from '../lib/session';
import { useRouter } from 'next/router';

export default function LoginPage(){
  const router = useRouter();
  const [profile, setProfile] = useState(storage.get('edtech.v1.profile', { name: '', standard: '8', subject: 'Mathematics' }));
  const [questions, setQuestions] = useState([]);
  const [chapter, setChapter] = useState('');
  const [level, setLevel] = useState('');

  useEffect(()=>{ fetch('/questions.json').then(r=>r.json()).then(setQuestions).catch(console.error); }, []);
  const chapters = useMemo(()=> Array.from(new Set(questions.map(q=>q.chapter))), [questions]);
  const canStart = profile.name.trim() && chapter && level;

  function startPractice(){
    storage.set('edtech.v1.profile', profile);
    createSession({ chapter, level, questions, size: 9 });
    router.push('/exam');
  }

  return (
    <div className='app'>
      <div className='header'>
        <div className='brand'>School Exam Portal</div>
        <div className='badge'>CBSE · Grade {profile.standard || '8'}</div>
      </div>

      <div className='panel'>
        <Stepper step={chapter ? (level ? 3 : 2) : 1} />
        <div className='row'>
          <div style={{ gridColumn:'span 4' }}>
            <label className='label'>Student Name</label>
            <input className='input' placeholder='Enter name' value={profile.name} onChange={(e)=>setProfile({...profile, name:e.target.value})} />
          </div>
          <div style={{ gridColumn:'span 4' }}>
            <label className='label'>Class/Standard</label>
            <select className='select' value={profile.standard} onChange={(e)=>setProfile({...profile, standard:e.target.value})}>
              <option value='8'>8</option>
              <option value='12'>12</option>
            </select>
          </div>
          <div style={{ gridColumn:'span 4' }}>
            <label className='label'>Subject</label>
            <select className='select' value={profile.subject} onChange={(e)=>setProfile({...profile, subject:e.target.value})}>
              <option>Mathematics</option>
            </select>
          </div>
          <div style={{ gridColumn:'span 6' }}>
            <label className='label'>Chapter</label>
            <select className='select' value={chapter} onChange={(e)=> setChapter(e.target.value) }>
              <option value=''>Select Chapter</option>
              {chapters.map(ch => (<option key={ch} value={ch}>{ch}</option>))}
            </select>
          </div>
          <div style={{ gridColumn:'span 6' }}>
            <label className='label'>Difficulty</label>
            <select className='select' value={level} onChange={(e)=> setLevel(e.target.value) }>
              <option value=''>Select Difficulty</option>
              {['Easy','Medium','Hard'].map(d => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
        </div>
        <div style={{display:'flex', gap:12, marginTop:12}}>
          <button className='btn' onClick={startPractice} disabled={!canStart}>Start Practice</button>
          {!canStart && <span className='hint'>Enter name and choose chapter + difficulty.</span>}
        </div>
      </div>
    </div>
  );
}
