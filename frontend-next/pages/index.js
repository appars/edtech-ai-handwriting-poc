import { useEffect, useMemo, useRef, useState } from "react";
import InkCanvas from "../components/InkCanvas";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function Home() {
  const inkRef = useRef(null);

  // Question data + selection state
  const [questions, setQuestions] = useState([]);
  const [chapter, setChapter] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [qId, setQId] = useState("");
  const selectedQuestion = useMemo(
    () => questions.find((q) => q.id === qId) || null,
    [qId, questions]
  );

  // Answer & result state
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);

  // Load Grade-8 questions from /public/questions.json
  useEffect(() => {
    fetch("/questions.json")
      .then((r) => r.json())
      .then(setQuestions)
      .catch((e) => console.error("Failed to load questions:", e));
  }, []);

  // Derive lists for selectors
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

  // Canvas control handlers
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

  // Build payload from selected question metadata
  function buildPayload(q, userAnswer) {
    if (!q) return null;
    const at = (q.answer_type || "").toLowerCase();

    if (at === "numeric") {
      return {
        answer: userAnswer,
        answer_type: "numeric",
        numeric_expected: q.numeric_expected ?? q.expected,
        tolerance: q.tolerance ?? 0
      };
    }

    if (at === "numeric_fraction_ok") {
      return {
        answer: userAnswer,
        answer_type: "numeric_fraction_ok",
        numeric_expected: q.numeric_expected ?? q.expected,
        expected_fraction: q.expected_fraction ?? null,
        tolerance: q.tolerance ?? 0
      };
    }

    if (at === "categorical") {
      return {
        answer: userAnswer,
        answer_type: "categorical",
        categorical_expected: q.expected
      };
    }

    if (at === "ratio") {
      return {
        answer: userAnswer,
        answer_type: "ratio",
        ratio_expected: q.expected_ratio ?? q.expected
      };
    }

    // For now, unsupported types (algebraic) will be flagged
    return { answer: userAnswer, answer_type: at || "unknown" };
  }

  // Submit to backend
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
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      setResult({
        ...json,
        meta: { id: q.id, chapter: q.chapter, level: q.level }
      });
      setStatus("Done");
    } catch (e) {
      console.error(e);
      setStatus("Error");
      setResult({ correct: false, feedback: "Server error.", error: String(e) });
    }
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100 }}>
      <h1 style={{ margin: "0 0 12px" }}>AI-Powered Exam POC</h1>

      {/* Selectors */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        {/* Chapter */}
        <div>
          <label style={{ fontSize: 12, color: "#444" }}>Chapter</label>
          <select
            value={chapter}
            onChange={(e) => {
              setChapter(e.target.value);
              setQId("");
            }}
            style={selectStyle()}
          >
            <option value="">Select Chapter</option>
            {chapters.map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div>
          <label style={{ fontSize: 12, color: "#444" }}>Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setQId("");
            }}
            style={selectStyle()}
          >
            <option value="">Select Difficulty</option>
            {["Easy", "Medium", "Hard"].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Question */}
        <div style={{ minWidth: 360 }}>
          <label style={{ fontSize: 12, color: "#444" }}>Question</label>
          <select
            value={qId}
            onChange={(e) => setQId(e.target.value)}
            style={{ ...selectStyle(), minWidth: 360 }}
          >
            <option value="">Select Question</option>
            {filtered.map((q) => (
              <option key={q.id} value={q.id}>
                {q.level}: {q.prompt.slice(0, 80)}{q.prompt.length > 80 ? "…" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt */}
      {selectedQuestion ? (
        <div style={{
          background: "#f6f8ff",
          border: "1px solid #ccd4ff",
          padding: 12, borderRadius: 8, marginBottom: 8
        }}>
          <strong>Prompt:</strong> {selectedQuestion.prompt}
        </div>
      ) : (
        <div style={{ marginBottom: 8, color: "#666" }}>
          Select a chapter, difficulty, and question to begin.
        </div>
      )}

      {/* Canvas */}
      <InkCanvas ref={inkRef} width={1000} height={500} />

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
        <button onClick={handleUndo} style={btn()}>Undo</button>
        <button onClick={handleClear} style={btn("secondary")}>Clear</button>
        <button onClick={handleDownloadPNG} style={btn("secondary")}>Download PNG</button>

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 16 }}>
          <label htmlFor="final" style={{ fontSize: 14 }}>Final answer:</label>
          <input
            id="final"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="e.g., 1, 32, 4:1"
            style={inputStyle()}
          />
        </div>

        <button onClick={handleSubmitToAI} style={btn()}>Submit to AI</button>
        <span style={{ fontSize: 13, color: "#666" }}>{status}</span>
      </div>

      {/* Result */}
      <div style={{ marginTop: 16 }}>
        <h3>AI Result</h3>
        <pre style={pre()}>{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}

/* styles */
function selectStyle() {
  return { padding: "10px 12px", borderRadius: 8, border: "1px solid #c9c9c9", minWidth: 220 };
}
function inputStyle() {
  return { padding: "10px 12px", borderRadius: 8, border: "1px solid #c9c9c9", minWidth: 160 };
}
function btn(variant) {
  const base = { padding: "10px 14px", borderRadius: 8, border: "1px solid #c9c9c9", cursor: "pointer", fontWeight: 600 };
  if (variant === "secondary") return { ...base, background: "#fff", color: "#111" };
  return { ...base, background: "#111", color: "#fff" };
}
function pre() {
  return { background: "#0b1020", color: "#d7e2ff", padding: 12, borderRadius: 8, overflowX: "auto" };
}

