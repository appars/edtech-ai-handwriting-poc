import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const InkCanvas = forwardRef(function InkCanvas(
  { width = 1000, height = 500, penColor = "#111" },
  ref
) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const dprRef = useRef(1);
  const drawingRef = useRef(false);
  const lastRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const currentStroke = useRef([]);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL("image/png"),
    clear: () => clearCanvas(),
    undo: () => undoStroke(),
  }));

  useEffect(() => {
    const c = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;
    c.width = width * dpr;
    c.height = height * dpr;
    c.style.width = width + "px";
    c.style.height = height + "px";
    const ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctxRef.current = ctx;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    const down = (e) => {
      drawingRef.current = true;
      lastRef.current = { x: e.offsetX, y: e.offsetY };
      currentStroke.current = [{ x: e.offsetX, y: e.offsetY }];
    };

    const move = (e) => {
      if (!drawingRef.current) return;
      const ctx = ctxRef.current;
      const a = lastRef.current;
      const b = { x: e.offsetX, y: e.offsetY };
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      lastRef.current = b;
      currentStroke.current.push(b);
    };

    const up = () => {
      if (drawingRef.current && currentStroke.current.length) {
        setStrokes((prev) => [...prev, currentStroke.current]);
      }
      drawingRef.current = false;
      currentStroke.current = [];
    };

    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointerleave", up);

    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", up);
      c.removeEventListener("pointerleave", up);
    };
  }, [width, height, penColor]);

  function redrawAll(strokesToDraw = strokes) {
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = penColor;

    for (const stroke of strokesToDraw) {
      for (let i = 1; i < stroke.length; i++) {
        const a = stroke[i - 1];
        const b = stroke[i];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  function clearCanvas() {
    setStrokes([]);
    redrawAll([]);
  }

  function undoStroke() {
    if (!strokes.length) return;
    const next = strokes.slice(0, -1);
    setStrokes(next);
    redrawAll(next);
  }

  return (
    <div style={{ border: "1px solid #cfcfcf", borderRadius: 12, padding: 8, background: "#fafafa" }}>
      <canvas ref={canvasRef} />
      <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
        Draw your answer here (supports mouse or Wacom pen). Undo / Clear below.
      </div>
    </div>
  );
});

export default InkCanvas;

