import './attention-dot.css';
export default function AttentionDot({label='Unread update or action needed'}:{label?:string}) {
  return <span className="section-attention-dot" role="img" aria-label={label} title={label}/>;
}
