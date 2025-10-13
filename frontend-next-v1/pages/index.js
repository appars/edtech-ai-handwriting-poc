
import { useEffect, useState } from "react";
import { loadProfile, saveProfile } from "../lib/session";
import { useRouter } from "next/router";

export default function Login(){
  const r = useRouter();
  const [mounted,setMounted]=useState(false);
  const [name,setName]=useState("");
  const [standard,setStandard]=useState("8");
  useEffect(()=>{setMounted(true); const p=loadProfile(); if(p){setName(p.name||""); setStandard(String(p.standard||"8"));}},[]);
  if(!mounted) return null;
  function go(){ if(!/^[A-Za-z][A-Za-z\s]{2,}$/.test(name)) return alert("Enter full name (letters only)."); const p={name,standard:Number(standard)}; saveProfile(p); r.push("/dashboard"); }
  return (<div className="app">
    <div className="header"><div className="brand">School Exam Portal</div></div>
    <div className="panel">
      <div className="row">
        <div style={{gridColumn:'span 8'}}>
          <label className="label">Student Name</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Enter name"/>
        </div>
        <div style={{gridColumn:'span 4'}}>
          <label className="label">Class / Standard</label>
          <select className="select" value={standard} onChange={e=>setStandard(e.target.value)}>
            <option value="8">8</option>
            <option value="12">12</option>
          </select>
        </div>
      </div>
      <div style={{display:'flex',gap:12,marginTop:12}}>
        <button className="btn" onClick={go}>Go to Dashboard</button>
      </div>
    </div>
  </div>);
}
