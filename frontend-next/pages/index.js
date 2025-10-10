// pages/index.js
import { useEffect, useMemo, useState } from "react";
import Stepper from "../components/Stepper";
import { storage } from "../lib/storage";
import { createSession, matchesSubject, matchesStandard } from "../lib/session";
import { useRouter } from "next/router";

export default function StartScreen() {
  const router = useRouter();

  // 1) Hydration guard (must be the first hook)
  const [mounted, setMounted] = useState(false);

  // 2) Profile state (init with safe defaults; load real values after mount)
  const [profile, setProfile] = useState({
    name: "",
    standard: "8",
    subject: "Mathematics",
  });

  // 3) Questions + UI state hooks
  const [questions, setQuestions] = useState([]);
  const [chapter, setChapter] = useState("");
  const [level, setLevel] = useState("");
  const [errors, setErrors] = useState({});

  // ---- Effects (hooks order preserved every render) ----
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Load profile from localStorage after mount
    if (!mounted) return;
    const saved = storage.get("ed.v2.profile");
    if (saved) setProfile(saved);
  }, [mounted]);

  useEffect(() => {
    fetch("/questions.json")
      .then((r) => r.json())
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, []);

  // ---- Derived data ----
  const filteredChapters = useMemo(() => {
    const set = new Set(
      questions
        .filter(
          (q) =>
            matchesSubject(q, profile.subject) &&
            matchesStandard(q, profile.standard)
        )
        .map((q) => q.chapter)
    );
    return Array.from(set).sort();
  }, [questions, profile.subject, profile.standard]);

  useEffect(() => {
    if (chapter && !filteredChapters.includes(chapter)) setChapter("");
  }, [filteredChapters, chapter]);

  // ---- Actions ----
  function validate() {
    const e = {};
    if (!/^[A-Za-z][A-Za-z\s]{2,}$/.test(profile.name || "")) {
      e.name = "Enter full name (letters only).";
    }
    if (!profile.standard) e.standard = "Choose a class (8 or 12).";
    if (!profile.subject) e.subject = "Choose a subject.";
    if (!chapter) e.chapter = "Choose a chapter.";
    if (!level) e.level = "Choose difficulty.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function startPractice() {
    if (!validate()) return;
    storage.set("ed.v2.profile", profile);
    createSession({
      subject: profile.subject,
      standard: profile.standard,
      chapter,
      level,
      questions,
      size: 10,
    });
    router.push("/exam");
  }

  // Optional lightweight shell while hydrating
  if (!mounted) {
    return (
      <div className="app">
        <div className="header">
          <div className="brand">School Exam Portal</div>
        </div>
        <div className="panel">
          <div className="hint">Loading…</div>
        </div>
      </div>
    );
  }

  // ---- UI ----
  return (
    <div className="app">
      <div className="header">
        <div className="brand">School Exam Portal</div>
        <div className="badge">
          {profile.subject} · Grade {profile.standard}
        </div>
      </div>

      <div className="panel">
        <Stepper step={chapter ? (level ? 3 : 2) : 1} />

        <div className="row">
          {/* Name */}
          <div style={{ gridColumn: "span 4" }}>
            <label className="label">Student Name</label>
            <input
              className="input"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Enter name"
            />
            <div className="hint" style={{ color: "#ef4444" }}>
              {errors.name || ""}
            </div>
          </div>

          {/* Standard */}
          <div style={{ gridColumn: "span 4" }}>
            <label className="label">Class / Standard</label>
            <select
              className="select"
              value={profile.standard}
              onChange={(e) => setProfile({ ...profile, standard: e.target.value })}
            >
              <option value="8">8</option>
              <option value="12">12</option>
            </select>
            <div className="hint" style={{ color: "#ef4444" }}>
              {errors.standard || ""}
            </div>
          </div>

          {/* Subject */}
          <div style={{ gridColumn: "span 4" }}>
            <label className="label">Subject</label>
            <select
              className="select"
              value={profile.subject}
              onChange={(e) => setProfile({ ...profile, subject: e.target.value })}
            >
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
            </select>
            <div className="hint" style={{ color: "#ef4444" }}>
              {errors.subject || ""}
            </div>
          </div>

          {/* Chapter */}
          <div style={{ gridColumn: "span 6" }}>
            <label className="label">Chapter</label>
            <select
              className="select"
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
            >
              <option value="">Select Chapter</option>
              {filteredChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
            <div className="hint" style={{ color: "#ef4444" }}>
              {errors.chapter || ""}
            </div>
          </div>

          {/* Difficulty */}
          <div style={{ gridColumn: "span 6" }}>
            <label className="label">Difficulty</label>
            <select
              className="select"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            >
              <option value="">Select Difficulty</option>
              {["Easy", "Medium", "Hard"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <div className="hint" style={{ color: "#ef4444" }}>
              {errors.level || ""}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button className="btn" onClick={startPractice}>
            Start Practice
          </button>
          <button
            className="btn secondary"
            onClick={() => {
              setProfile({ name: "", standard: "8", subject: "Mathematics" });
              setChapter("");
              setLevel("");
              setErrors({});
              storage.remove("ed.v2.profile");
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

