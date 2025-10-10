
import React,{forwardRef,useEffect,useImperativeHandle,useRef,useState}from'react';
const GRID='rgba(2,6,23,0.06)';
const InkCanvas=forwardRef(function InkCanvas({width=900,height=420,penColor='#0f172a'},ref){
  const canvasRef=useRef(null),ctxRef=useRef(null),drawingRef=useRef(false),lastRef=useRef(null);
  const[strokes,setStrokes]=useState([]); const current=useRef([]);
  useImperativeHandle(ref,()=>({toDataURL:()=>canvasRef.current?.toDataURL('image/png',0.8),clear:()=>clearCanvas(),undo:()=>undoStroke(),fromDataURL:(d)=>loadFrom(d)}));
  useEffect(()=>{const c=canvasRef.current,dpr=window.devicePixelRatio||1;c.width=width*dpr;c.height=height*dpr;c.style.width=width+'px';c.style.height=height+'px';c.style.touchAction='none';const ctx=c.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=penColor;ctx.lineWidth=2;ctxRef.current=ctx;drawBG();
    const down=e=>{drawingRef.current=true;lastRef.current={x:e.offsetX,y:e.offsetY};current.current=[lastRef.current];};
    const move=e=>{if(!drawingRef.current)return;const a=lastRef.current,b={x:e.offsetX,y:e.offsetY};const ctx=ctxRef.current;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();lastRef.current=b;current.current.push(b);};
    const up=()=>{if(drawingRef.current&&current.current.length)setStrokes(p=>[...p,current.current]);drawingRef.current=false;current.current=[];};
    c.addEventListener('pointerdown',down);c.addEventListener('pointermove',move);c.addEventListener('pointerup',up);c.addEventListener('pointerleave',up);c.addEventListener('pointercancel',up);c.addEventListener('contextmenu',e=>e.preventDefault());
    return()=>{c.removeEventListener('pointerdown',down);c.removeEventListener('pointermove',move);c.removeEventListener('pointerup',up);c.removeEventListener('pointerleave',up);c.removeEventListener('pointercancel',up);};
  },[width,height,penColor]);
  function drawBG(){const ctx=ctxRef.current;ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.save();ctx.strokeStyle=GRID;ctx.lineWidth=1;const step=28;for(let x=0;x<=width;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,height);ctx.stroke();}for(let y=0;y<=height;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}ctx.restore();}
  function redrawAll(s=strokes){drawBG();const ctx=ctxRef.current;ctx.strokeStyle='#0f172a';for(const st of s){for(let i=1;i<st.length;i++){const a=st[i-1],b=st[i];ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}}
  function clearCanvas(){setStrokes([]);redrawAll([])} function undoStroke(){if(!strokes.length)return;const n=strokes.slice(0,-1);setStrokes(n);redrawAll(n)}
  function loadFrom(data){if(!data)return clearCanvas();const img=new Image();img.onload=()=>{drawBG();ctxRef.current.drawImage(img,0,0,width,height)};img.src=data;}
  return <div className='canvas-shell'><canvas ref={canvasRef} style={{cursor:'crosshair',borderRadius:10,width:'100%'}}/><div className='hint'>Use mouse or stylus. Undo / Clear below.</div></div>
});
export default InkCanvas;
