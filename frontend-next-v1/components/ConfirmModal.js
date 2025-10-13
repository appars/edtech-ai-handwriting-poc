
export default function ConfirmModal({open,title='Are you sure?',message,onCancel,onConfirm,confirmText='Confirm'}){
  if(!open) return null; return(<div className="modal" onClick={onCancel}>
    <div className="modal-card" onClick={e=>e.stopPropagation()}>
      <h3 style={{marginTop:0}}>{title}</h3><p>{message}</p>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
        <button className="btn secondary" onClick={onCancel}>Cancel</button>
        <button className="btn danger" onClick={onConfirm}>{confirmText}</button>
      </div>
    </div>
  </div>)
}
