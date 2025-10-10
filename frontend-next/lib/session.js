// lib/session.js
import { storage } from "./storage";

export function createSession({ chapter, level, questions, size = 9 }){
  const pool = questions.filter(q => q.chapter === chapter && q.level === level);
  const queue = pool.slice(0, size).map(q => q.id);
  const statuses = {}; for (const id of queue) statuses[id] = "unseen";
  if (queue.length) statuses[queue[0]] = "current";
  const session = { id:`sess_${Date.now()}`, chapter, level, queue, index:0, statuses, startedAt:new Date().toISOString(), totalElapsedSec:0 };
  storage.set("edtech.v1.session", session);
  return session;
}
export const loadSession = ()=> storage.get("edtech.v1.session", null);
export const saveSession = (s)=> storage.set("edtech.v1.session", s);
export const clearSession = ()=> storage.remove("edtech.v1.session");
export function addAttempt(attempt){ const list = storage.get("edtech.v1.attempts", []); list.push(attempt); storage.set("edtech.v1.attempts", list); return list; }
export const loadAttempts = ()=> storage.get("edtech.v1.attempts", []);
export const clearAttempts = ()=> storage.remove("edtech.v1.attempts");
export function progressFromAttempts(list){ const attempted=list.length; const correct=list.filter(a=>a.correct).length; const skipped=list.filter(a=>a.feedback==='skipped').length; const accuracy=attempted?Math.round(correct/attempted*100):0; return {attempted, correct, skipped, accuracy}; }
