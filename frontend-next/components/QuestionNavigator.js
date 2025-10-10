// components/QuestionNavigator.js
export default function QuestionNavigator({ queue = [], statuses = {}, currentIndex = 0, onSelect }){
  return (
    <div className="panel" style={{padding:12}}>
      <div style={{fontWeight:800, color:'#1d4ed8', marginBottom:8}}>Questions</div>
      <div className="navgrid">
        {queue.map((id, i) => {
          const st = statuses[id] || 'unseen';
          const cls = `tile ${st} ${i===currentIndex ? 'current': ''}`.trim();
          return (<button key={id} className={cls} title={`Q${i+1}`} onClick={() => onSelect?.(i)}>Q{i+1}</button>);
        })}
      </div>
    </div>
  );
}
