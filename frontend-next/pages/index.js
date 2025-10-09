// pages/index.js
import { useEffect, useMemo, useRef, useState } from "react";
import InkCanvas from "@/components/InkCanvas";
// import InkCanvas from "../components/InkCanvas";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function Home() {
  const inkRef = useRef(null);

  // Questions & selection
  const [questions, setQuestions] = useState([]);
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [qId, setQId] = useState("");
  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === qId) || null,
    [qId, questions]
  );

  // Answer & API result
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);

  // Load demo questions
  useEffect(() => {
    fetch("/questions.json")
      .then((r) => r.json())
      .then(setQuestions)
      .catch((e) => console.error("Failed to load questions:", e));
  }, []);

  // Derived lists
  const chapters = useMemo(
    () => Array.from(new Set(questions.map((q) => q.chapter))),
    [questions]
  );

  const filtered = useMemo(
    () =>
      questions.filter(
        (q) =>
          (!chapter || q.chapter === chapter) &&
          (!difficulty || q.level === difficulty)
      ),
    [questions, chapter, difficulty]
  );

  // Build payload based on question type
  function buildPayload(q, userAnswer) {
    if (!q) return null;
    const at = (q.answer_type || "").toLowerCase();

    if (at === "numeric") {
      return {
        answer: userAnswer,
        answer_type: "numeric",
        numeric_expected: q.numeric_expected ?? q.expected,
        tolerance: q.tolerance ?? 0,
      };
    }
    if (at === "numeric_fraction_ok") {
      return {
        answer: userAnswer,
        answer_type: "numeric_fraction_ok",
        numeric_expected: q.numeric_expected ?? q.expected,
        expected_fraction: q.expected_fraction ?? null,
        tolerance: q.tolerance ?? 0,
      };
    }
    if (at === "categorical") {
      return {
        answer: userAnswer,
        answer_type: "categorical",
        categorical_expected: q.expected,
      };
    }
    if (at === "ratio") {
      return {
        answer: userAnswer,
        answer_type: "ratio",
        ratio_expected: q.expected_ratio ?? q.expected,
      };
    }
    return { answer: userAnswer, answer_type: at || "unknown" };
  }

  // API call
  const handleSubmitToAI = async () => {
    const q = selectedQuestion;
    if (!q) {
      setResult({ correct: false, feedback: "Pick a question first." });
      return;
    }
    const payload = buildPayload(q, answer);
    if (!payload) {
      setResult({ correct: false, feedback: "Invalid payload." });
      return;
    }

    try {
      setStatus("Submitting…");
      setResult(null);

      const res = await fetch(`${API_URL}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      setResult({
        ...json,
        meta: { id: q.id, chapter: q.chapter, level: q.level },
      });
      setStatus("Done");
    } catch (e) {
      console.error(e);
      setStatus("Error");
      setResult({ correct: false, feedback: "Server error.", error: String(e) });
    }
  };

  const handleUndo = () => inkRef.current?.undo();
  const handleClear = () => inkRef.current?.clear();
  const handleDownloadPNG = () => {
    const dataUrl = inkRef.current?.toDataURL();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `answer-${Date.now()}.png`;
    a.click();
  };

  const resultClass = result?.correct ? "result ok" : "result bad";

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="brand">AI-Powered Exam POC</div>
        <div className="badge">CBSE Demo · Grade 8</div>
      </div>

      {/* Top selectors */}
      <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
        <div className="row">
          <div style={{ gridColumn: "span 3" }}>
            <label className="label">Chapter</label>
            <select
              className="select"
              value={chapter}
              onChange={(e) => {
                setChapter(e.target.value);
                setQId("");
              }}
            >
              <option value="">Select Chapter</option>
              {chapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "span 3" }}>
            <label className="label">Difficulty</label>
            <select
              className="select"
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setQId("");
              }}
            >
              <option value="">Select Difficulty</option>
              {["Easy", "Medium", "Hard"].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "span 4" }}>
            <label className="label">Question</label>
            <select
              className="select"
              value={qId}
              onChange={(e) => setQId(e.target.value)}
            >
              <option value="">Select Question</option>
              {filtered.map((q, i) => (
                <option key={q.id} value={q.id} title={q.prompt}>
                  {`Q${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prompt */}
        {selectedQuestion ? (
          <div className="prompt">
            <strong>Prompt:</strong> {selectedQuestion.prompt}
          </div>
        ) : (
          <div className="hint">Select Chapter → Difficulty → Question to begin.</div>
        )}
      </div>

      {/* Canvas */}
      <div className="card" style={{ padding: 14 }}>
        <InkCanvas ref={inkRef} width={1100} height={520} />

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn secondary" onClick={handleUndo}>Undo</button>
          <button className="btn secondary" onClick={handleClear}>Clear</button>
          <button className="btn secondary" onClick={handleDownloadPNG}>Download PNG</button>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 6 }}>
            <label htmlFor="final" className="label" style={{ margin: 0 }}>Final answer:</label>
            <input
              id="final"
              className="input"
              placeholder="e.g., 1, 32, 4:1"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              style={{ width: 180 }}
            />
          </div>

          <button className="btn" onClick={handleSubmitToAI}>Submit to AI</button>
          <span className="hint">{status}</span>
        </div>
      </div>

      {/* Result */}
      <div className={result?.correct === undefined ? "result" : resultClass}>
        <pre style={{ margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}

