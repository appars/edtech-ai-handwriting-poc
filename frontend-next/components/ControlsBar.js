
export default function ControlsBar({answer,setAnswer,onUndo,onClear,onDownload,onSubmit,onSkip,onNext,canSubmit,busy,canNext}){
  return(<div style={{display:'flex',gap:10,alignItems:'center',marginTop:12,flexWrap:'wrap'}}>
    <button className='btn secondary' onClick={onUndo}>Undo</button>
    <button className='btn secondary' onClick={onClear}>Clear</button>
    <button className='btn secondary' onClick={onDownload}>Download PNG</button>
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <label className='label' style={{margin:0}}>Final answer:</label>
      <input className='input' style={{width:220}} placeholder='e.g., 1, 32, 4:1' value={answer} onChange={e=>setAnswer(e.target.value)}/>
    </div>
    <button className='btn' onClick={onSubmit} disabled={!canSubmit||busy}>{busy?'Submitting…':'Submit'}</button>
    <button className='btn secondary' onClick={onSkip}>Skip</button>
    <button className='btn secondary' onClick={onNext} disabled={!canNext}>Next</button>
  </div>);
}
