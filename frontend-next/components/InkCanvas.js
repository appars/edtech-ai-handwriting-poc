// components/InkCanvas.js
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
const InkCanvas = forwardRef(function InkCanvas({ width=900, height=420, penColor='#0f172a' }, ref){
  const canvasRef = useRef(null), ctxRef = useRef(null), drawingRef = useRef(false), lastRef = useRef(null);
  const [strokes, setStrokes] = useState([]); const currentStroke = useRef([]);
  useImperativeHandle(ref, () => ({ toDataURL:()=>canvasRef.current?.toDataURL('image/png'), clear:()=>clearCanvas(), undo:()=>undoStroke(), strokeCount:()=>strokes.length }));
  useEffect(()=>{ const c=canvasRef.current, dpr=window.devicePixelRatio||1; c.width=width*dpr; c.height=height*dpr; c.style.width=width+'px'; c.style.height=height+'px'; c.style.touchAction='none';
    const ctx=c.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle=penColor; ctx.lineWidth=2; ctxRef.current=ctx; drawBackground();
    const down=e=>{drawingRef.current=true; lastRef.current={x:e.offsetX,y:e.offsetY}; currentStroke.current=[lastRef.current];};
    const move=e=>{ if(!drawingRef.current) return; const a=lastRef.current, b={x:e.offsetX,y:e.offsetY}; const ctx=ctxRef.current; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); lastRef.current=b; currentStroke.current.push(b); };
    const up=()=>{ if(drawingRef.current && currentStroke.current.length) setStrokes(p=>[...p,currentStroke.current]); drawingRef.current=false; currentStroke.current=[]; };
    c.addEventListener('pointerdown',down); c.addEventListener('pointermove',move); c.addEventListener('pointerup',up); c.addEventListener('pointerleave',up); c.addEventListener('pointercancel',up); c.addEventListener('contextmenu', e=>e.preventDefault());
    return ()=>{ c.removeEventListener('pointerdown',down); c.removeEventListener('pointermove',move); c.removeEventListener('pointerup',up); c.removeEventListener('pointerleave',up); c.removeEventListener('pointercancel',up); };
  }, [width,height,penColor]);
  function drawBackground(){ const ctx=ctxRef.current; ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,width,height); ctx.save(); ctx.strokeStyle='rgba(2,6,23,0.06)'; ctx.lineWidth=1; const step=28;
    for(let x=0;x<=width;x+=step){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); } for(let y=0;y<=height;y+=step){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); } ctx.restore(); }
  function redrawAll(s=strokes){ drawBackground(); const ctx=ctxRef.current; ctx.strokeStyle=penColor; for(const stroke of s){ for(let i=1;i<stroke.length;i++){ const a=stroke[i-1], b=stroke[i]; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } }
  function clearCanvas(){ setStrokes([]); redrawAll([]); }
  function undoStroke(){ if(!strokes.length) return; const next=strokes.slice(0,-1); setStrokes(next); redrawAll(next); }
  return (<div className='canvas-shell'><canvas ref={canvasRef} style={{cursor:'crosshair', borderRadius:10, width:'100%'}}/><div className='hint'>Use mouse or stylus. Undo / Clear below.</div></div>);
});
export default InkCanvas;
