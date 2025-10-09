import { useRef, useState } from "react";
import InkCanvas from "../components/InkCanvas";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function Home() {
  const inkRef = useRef(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState(null);

  const handleClear = () => inkRef.current?.clear();
  const handleUndo = () => inkRef.current?.undo();

  const handleDownloadPNG = () => {
    const dataUrl = inkRef.current?.toDataURL();
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `answer-${Date.now()}.png`;
    a.click();
  };

  const handleSubmitToAI = async () => {
    try {
      setStatus("Submitting…");
      setResult(null);

      const res = await fetch(`${API_URL}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const json = await res.json();
      setResult(json);
      setStatus("Done");
    } catch (e) {
      console.error(e);
      setStatus("Error");
      setResult({ error: String(e) });
    }
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100 }}>
      <h1 style={{ margin: "0 0 16px" }}>AI-Powered Exam POC</h1>
      <p style={{ marginTop: 0 }}>
        Write your answer, then submit for instant feedback from the AI checker.
      </p>

      <InkCanvas ref={inkRef} width={1000} height={500} />

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginTop: 12,
          flexWrap: "wrap",
        }}
      >
        <button onClick={handleUndo} style={btn()}>
          Undo
        </button>
        <button onClick={handleClear} style={btn("secondary")}>
          Clear
        </button>
        <button onClick={handleDownloadPNG} style={btn("secondary")}>
          Download PNG
        </button>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginLeft: 16,
          }}
        >
          <label htmlFor="final" style={{ fontSize: 14 }}>
            Final answer:
          </label>
          <input
            id="final"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="e.g., 3.14"
            style={input()}
          />
        </div>

        <button onClick={handleSubmitToAI} style={btn()}>
          Submit to AI
        </button>

        <span style={{ fontSize: 13, color: "#666" }}>{status}</span>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>AI Result</h3>
        <pre style={pre()}>{JSON.stringify(result, null, 2)}</pre>
      </div>
    </div>
  );
}

function btn(variant) {
  const base = {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #c9c9c9",
    cursor: "pointer",
    fontWeight: 600,
  };
  if (variant === "secondary") {
    return { ...base, background: "#fff", color: "#111" };
  }
  return { ...base, background: "#111", color: "#fff" };
}

function input() {
  return {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #c9c9c9",
    minWidth: 160,
  };
}

function pre() {
  return {
    background: "#0b1020",
    color: "#d7e2ff",
    padding: 12,
    borderRadius: 8,
    overflowX: "auto",
  };
}
