// components/ResultPanel.js
export default function ResultPanel({ result }){
  if (!result) return null;
  const cls = result.correct ? 'result ok' : 'result bad';
  return (<div className={cls} aria-live='polite'><pre style={{margin:0}}>{JSON.stringify(result, null, 2)}</pre></div>);
}
