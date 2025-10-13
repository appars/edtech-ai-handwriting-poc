
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import questionsData from "../../public/questions.json";

/**
 * Start Practice (selection) page
 * - Centered card with Subject, Chapter, Level
 * - Recent quick-picks
 * - Saves session to localStorage key "ed.v3.session"
 * - Navigates to /exam
 */

export default function NewPractice() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [level, setLevel] = useState("Easy");

  const levelFirstBtnRef = useRef(null);

  // Load profile (name, standard) from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ed.v3.profile");
      if (!raw) return;
      const p = JSON.parse(raw);
      setProfile(p || null);
    } catch {}
  }, []);

  // Subjects list from questions
  const subjects = useMemo(
    () => Array.from(new Set(questionsData.map((q) => q.subject))),
    []
  );

  // Chapters based on subject + grade
  const chapters = useMemo(() => {
    const grade = profile ? String(profile.standard) : null;
    const list = questionsData
      .filter((q) => {
        const okSub = subject ? q.subject === subject : true;
        const okGrade = grade ? String(q.standard) === grade : true;
        return okSub && okGrade;
      })
      .map((q) => q.chapter);
    return Array.from(new Set(list));
  }, [subject, profile]);

  // Chapter counts for display
  const chapterCounts = useMemo(() => {
    const grade = profile ? String(profile.standard) : null;
    const map = {};
    questionsData.forEach((q) => {
      if (subject && q.subject !== subject) return;
      if (grade && String(q.standard) !== grade) return;
      map[q.chapter] = (map[q.chapter] || 0) + 1;
    });
    return map;
  }, [subject, profile]);

  // Defaults
  useEffect(() => {
    if (!subject && subjects.length) setSubject(subjects[0]);
  }, [subjects, subject]);
  useEffect(() => {
    const list = chapters;
    if (list.length) {
      if (!list.includes(chapter)) setChapter(list[0]);
    } else {
      setChapter("");
    }
  }, [chapters]); // eslint-disable-line

  // Recent setups
  const RECENT_KEY = "ed.v3.recentSetups";
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      setRecent(Array.isArray(r) ? r.slice(0, 3) : []);
    } catch {}
  }, []);
  function saveRecent(sel) {
    try {
      const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      const next = [
        sel,
        ...prev.filter(
          (x) =>
            !(
              x.subject === sel.subject &&
              x.chapter === sel.chapter &&
              x.level === sel.level
            )
        ),
      ].slice(0, 3);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setRecent(next);
    } catch {}
  }
  function useRecent(r) {
    setSubject(r.subject);
    setChapter(r.chapter);
    setLevel(r.level);
  }

  const stepsDone =
    (subject ? 1 : 0) + (chapter ? 1 : 0) + (level ? 1 : 0);
  const progressPct = Math.round((stepsDone / 3) * 100);

  // ---- Start handler (saves session and navigates) ----
  function start() {
    if (!subject || !chapter || !level || !profile?.standard) return;

    const filtered = questionsData.filter(
      (q) =>
        q.subject === subject &&
        String(q.standard) === String(profile.standard) &&
        q.chapter === chapter &&
        q.level === level
    );

    if (filtered.length === 0) {
      alert("No questions found for this selection. Try another chapter or level.");
      return;
    }

    const payload = {
      subject,
      standard: profile.standard,
      chapter,
      level,
      questions: filtered.slice(0, 10), // adjust if you want fewer/more
    };

    try {
      localStorage.setItem("ed.v3.session", JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to save session", e);
    }

    saveRecent({ subject, chapter, level });
    router.push("/exam");
  }

  return (
    <div className="fixed inset-0 bg-gray-50 grid place-items-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">📘</div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Select Subject &amp; Chapter
          </h1>
          <p className="text-sm text-gray-600">Then pick a level to start</p>
        </div>

        {/* Progress */}
        <div
          className="w-full h-2 bg-gray-200 rounded-full mb-6"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-2 rounded-full bg-blue-600 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Greeting + Back */}
        <div className="flex items-center justify-between mb-4">
          {profile && (
            <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
              Hi, {profile.name || "Student"} · Grade {profile.standard}
            </span>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <span>←</span> Back to Dashboard
          </Link>
        </div>

        {/* Recent */}
        {recent.length > 0 && (
          <div className="mb-5">
            <div className="text-xs font-medium text-gray-700 mb-2">Recent</div>
            <div className="flex flex-wrap gap-2">
              {recent.map((r, i) => (
                <button
                  key={i}
                  onClick={() => useRecent(r)}
                  className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50"
                  type="button"
                >
                  {r.subject} · {r.chapter} · {r.level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          {/* Subject */}
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium mb-1"
            >
              Subject
            </label>
            <div className="relative">
              <select
                id="subject"
                className="w-full border rounded-xl p-3 pr-9 appearance-none"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                ▾
              </span>
            </div>
          </div>

          {/* Chapter */}
          <div>
            <label
              htmlFor="chapter"
              className="block text-sm font-medium mb-1"
            >
              Chapter
            </label>
            {chapters.length ? (
              <div className="relative">
                <select
                  id="chapter"
                  className="w-full border rounded-xl p-3 pr-9 appearance-none"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                >
                  {chapters.map((c) => (
                    <option key={c} value={c}>
                      {c}
                      {chapterCounts[c] ? ` — ${chapterCounts[c]} Qs` : ""}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ▾
                </span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No chapters for this subject/grade. Try another subject.
              </div>
            )}
          </div>

          {/* Level */}
          <div>
            <div className="block text-sm font-medium mb-1">Level</div>
            <div className="flex flex-wrap gap-2">
              {["Easy", "Medium", "Hard"].map((l, idx) => (
                <button
                  key={l}
                  ref={idx === 0 ? levelFirstBtnRef : null}
                  onClick={() => setLevel(l)}
                  className={`border rounded-full px-4 py-2 ${
                    level === l
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white hover:bg-gray-50"
                  }`}
                  type="button"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 left-0 right-0 bg-white mt-6 pt-3 border-t">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-medium">Selection:</span>{" "}
              {subject || "—"} · {chapter || "—"} · {level || "—"}
            </div>
            <div className="flex gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center border border-gray-300 rounded-xl px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                onClick={start}
                disabled={!subject || !chapter || !level}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50"
                type="button"
              >
                Start Practice ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
