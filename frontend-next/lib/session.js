// lib/session.js
import { storage } from "./storage";

/** Gentle helpers so filtering works even if some questions
 * don't explicitly include subject/standard fields.
 */
export function matchesSubject(q, subject) {
  if (!subject) return true;
  if (q.subject) return q.subject.toLowerCase() === subject.toLowerCase();

  // Heuristics (fallback):
  const physicsChapters = new Set([
    "Motion and Time", "Force and Pressure", "Friction", "Sound", "Light",
    "Electricity (Basics)", "Electrostatics", "Current Electricity",
    "Magnetic Effects of Current", "EMI & AC", "Ray Optics", "Wave Optics",
    "Dual Nature of Radiation", "Atoms and Nuclei", "Semiconductors"
  ]);
  const isPhysics =
    physicsChapters.has(q.chapter) ||
    (q.id || "").toUpperCase().startsWith("P"); // e.g., P8-, P12-
  const inferred = isPhysics ? "Physics" : "Mathematics";
  return inferred.toLowerCase() === subject.toLowerCase();
}

export function matchesStandard(q, standard) {
  if (!standard) return true;
  const stdNum = Number(standard);
  if (q.standard) return Number(q.standard) === stdNum;

  // Heuristics from ID prefix, e.g., M8-..., P12-...
  const id = (q.id || "").toUpperCase();
  if (id.includes("-")) {
    const maybe = id.match(/(M|P)(\d{1,2})-/);
    if (maybe && maybe[2]) return Number(maybe[2]) === stdNum;
  }
  // If not inferrable, allow both (safe fallback).
  return true;
}

/**
 * Create a session with subject + standard awareness.
 */
export function createSession({ subject, standard, chapter, level, questions, size = 10 }) {
  const pool = questions.filter(
    (q) =>
      matchesSubject(q, subject) &&
      matchesStandard(q, standard) &&
      q.chapter === chapter &&
      q.level === level
  );

  const queue = pool.slice(0, size).map((q) => q.id);
  const statuses = {};
  queue.forEach((id, i) => (statuses[id] = i === 0 ? "current" : "unseen"));

  const s = {
    id: `sess_${Date.now()}`,
    subject,
    standard,
    chapter,
    level,
    queue,
    index: 0,
    statuses,
    startedAt: new Date().toISOString(),
  };

  storage.set("ed.v2.session", s);
  storage.set(`ed.v2.answers.${s.id}`, {});
  return s;
}

export const loadSession = () => storage.get("ed.v2.session", null);
export const saveSession = (s) => storage.set("ed.v2.session", s);
export const clearSession = () => storage.remove("ed.v2.session");

export function addAttempt(a) {
  const list = storage.get("ed.v2.attempts", []);
  list.push(a);
  storage.set("ed.v2.attempts", list);
  return list;
}
export const loadAttempts = () => storage.get("ed.v2.attempts", []);

export function progressFromAttempts(list) {
  const attempted = list.length;
  const correct = list.filter((a) => a.correct).length;
  const skipped = list.filter((a) => a.feedback === "skipped").length;
  const accuracy = attempted ? Math.round((correct / attempted) * 100) : 0;
  const avgTime = attempted
    ? Math.round(list.reduce((s, a) => s + (a.timeTakenSec || 0), 0) / attempted)
    : 0;
  return { attempted, correct, skipped, accuracy, avgTime };
}
export const loadAnswers = (sid) => storage.get(`ed.v2.answers.${sid}`, {});
export const saveAnswers = (sid, map) => storage.set(`ed.v2.answers.${sid}`, map);

