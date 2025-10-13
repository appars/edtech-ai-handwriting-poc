
import { storage } from "./storage";
export function matchesSubject(q, subject){ if(!subject) return true; if(q.subject) return q.subject.toLowerCase()===subject.toLowerCase();
  const physics = new Set(["Motion and Time","Force and Pressure","Friction","Sound","Light","Electricity (Basics)","Electrostatics","Current Electricity","Magnetic Effects of Current","EMI & AC","Ray Optics","Wave Optics","Dual Nature of Radiation","Atoms and Nuclei","Semiconductors"]);
  const isPhys = physics.has(q.chapter) || (q.id||'').toUpperCase().startsWith('P'); return (isPhys?'Physics':'Mathematics').toLowerCase()===subject.toLowerCase();}
export function matchesStandard(q, standard){ if(!standard) return true; const s=Number(standard); if(q.standard) return Number(q.standard)===s;
  const m=(q.id||'').toUpperCase().match(/(M|P)(\d{1,2})-/); return m&&m[2]? Number(m[2])===s : true; }
export function createSession({subject,standard,chapter,level,questions,size=5}){
  const pool = questions.filter(q=>matchesSubject(q,subject)&&matchesStandard(q,standard)&&q.chapter===chapter&&q.level===level);
  const pick = pool.slice(0,size).map(q=>q.id);
  const statuses = {}; pick.forEach((id,i)=>statuses[id]=i===0?'current':'unseen');
  const s = { id:`sess_${Date.now()}`, subject, standard, chapter, level, questions:pick, index:0, statuses, answers:{}, startedAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  storage.set("ed.v3.session.current", s); return s;
}
export const loadSession=()=>storage.get("ed.v3.session.current",null);
export const saveSession=(s)=>{s.updatedAt=new Date().toISOString(); storage.set("ed.v3.session.current",s);}
export const clearSession=()=>storage.remove("ed.v3.session.current");
export const loadProfile=()=>storage.get("ed.v3.profile",null);
export const saveProfile=(p)=>storage.set("ed.v3.profile",p);
export const logout=()=>{storage.remove("ed.v3.profile"); storage.remove("ed.v3.session.current");}
export function addAttempt(a){ const list=storage.get("ed.v3.attempts",[]); list.unshift(a); storage.set("ed.v3.attempts",list); return list; }
export const loadAttempts=()=>storage.get("ed.v3.attempts",[]);
export function sessionsLog(){ return storage.get("ed.v3.sessions",[]); }
export function addSessionSummary(summary){ const list=sessionsLog(); list.unshift(summary); storage.set("ed.v3.sessions",list); return list; }
