
import {useEffect,useState} from 'react';
export default function Toast({msg,timeout=1600,onClose}){
  const[open,setOpen]=useState(!!msg);useEffect(()=>{if(!msg)return;setOpen(true);const t=setTimeout(()=>{setOpen(false);onClose?.()},timeout);return()=>clearTimeout(t)},[msg]);
  if(!open||!msg) return null; return <div className="toast">{msg}</div>;
}
