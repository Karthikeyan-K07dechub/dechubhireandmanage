import { useId, useState } from 'react';
import paths from './world-map-paths.json';
import type { Worker } from '../types/dashboard.type';
import './analytics-charts.css';

export const CHART_COLORS = ['#7654cc', '#25a99a', '#5c9ee6', '#e5b249', '#df8297', '#8b9bac'];
export type ChartRow = [string, number];
const short = (n: number) => Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const monthLabel = (month: string) => new Date(month + '-01T00:00:00Z').toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' });
export function recentMonths(keys: string[]) {
  const valid = keys.filter(k => /^\d{4}-\d{2}$/.test(k)).sort();
  if (!valid.length) return [];
  const start = new Date(valid[0] + '-01T00:00:00Z'); const end = new Date(valid[valid.length - 1] + '-01T00:00:00Z');
  const lower = new Date(end); lower.setUTCMonth(lower.getUTCMonth() - 23);
  if (start < lower) start.setTime(lower.getTime());
  const months: string[] = [];
  while (start <= end) { months.push(start.toISOString().slice(0, 7)); start.setUTCMonth(start.getUTCMonth() + 1); }
  return months;
}
function Tooltip({ title, value, left, top = 10 }: { title: string; value: string; left: number; top?: number }) {
  return <div className="ac-tooltip" role="tooltip" style={{ left: `${Math.max(18, Math.min(82, left))}%`, top }}><strong>{title}</strong><span>{value}</span></div>;
}
export function AreaChart({ rows, unit = '', label }: { rows: ChartRow[]; unit?: string; label: string }) {
  const id = useId().replace(/:/g, ''); const [hover, setHover] = useState<number | null>(null);
  if (!rows.length) return <p className="ac-empty">No records for this period.</p>;
  const max = Math.max(1, ...rows.map(r => r[1]));
  const x = (i: number) => rows.length === 1 ? 350 : 65 + i / (rows.length - 1) * 595;
  const y = (v: number) => 230 - v / max * 170;
  const line = rows.map((r, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(r[1])}`).join(' ');
  return <div className="ac-chart" onMouseLeave={() => setHover(null)}><svg viewBox="0 0 700 290" role="group" aria-label={label}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8d72dc" stopOpacity=".4" /><stop offset="100%" stopColor="#8d72dc" stopOpacity=".03" /></linearGradient></defs>
    {[0, .25, .5, .75, 1].map(t => <g key={t}><line x1="65" x2="660" y1={y(t * max)} y2={y(t * max)} className="ac-gridline" /><text x="55" y={y(t * max) + 4} textAnchor="end" className="ac-axis">{short(t * max)}</text></g>)}
    <path d={`${line} L ${x(rows.length - 1)} 230 L ${x(0)} 230 Z`} fill={`url(#${id})`} /><path d={line} fill="none" stroke="#7956cb" strokeWidth="3" />
    {rows.map(([month, value], i) => <g key={month}><circle cx={x(i)} cy={y(value)} r="10" fill="transparent" tabIndex={0} aria-label={`${monthLabel(month)}: ${unit} ${value.toLocaleString()}`} onFocus={() => setHover(i)} onBlur={() => setHover(null)} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} /><circle cx={x(i)} cy={y(value)} r={hover === i ? 5 : 3} fill="#7956cb" pointerEvents="none" />{(rows.length <= 7 || i % Math.ceil(rows.length / 6) === 0 || i === rows.length - 1) && <text x={x(i)} y="260" textAnchor="middle" className="ac-axis">{monthLabel(month)}</text>}</g>)}
  </svg>{hover !== null && rows[hover] && <Tooltip title={monthLabel(rows[hover][0])} value={`${unit} ${rows[hover][1].toLocaleString()}`} left={x(hover) / 7} />}</div>;
}
export function StackedChart({ rows, labels }: { rows: { month: string; values: number[] }[]; labels: string[] }) {
  const [hover, setHover] = useState<{ month: string; index: number; value: number; left: number } | null>(null);
  if (!rows.length) return <p className="ac-empty">No project records for this period.</p>;
  const max = Math.max(1, ...rows.map(r => r.values.reduce((sum, v) => sum + v, 0))); const slot = 595 / rows.length;
  return <><div className="ac-chart" onMouseLeave={() => setHover(null)}><svg viewBox="0 0 700 290" role="group" aria-label="Projects by creation month and current delivery status">
    {[0, .5, 1].map(t => <g key={t}><line x1="65" x2="660" y1={230 - t * 170} y2={230 - t * 170} className="ac-gridline" /><text x="55" y={234 - t * 170} textAnchor="end" className="ac-axis">{short(max * t)}</text></g>)}
    {rows.map((row, index) => { let accumulated = 0; const x = 65 + slot * (index + .5); return <g key={row.month}>{row.values.map((value, i) => { const height = value / max * 170; accumulated += height; return <rect key={i} x={x - Math.min(24, slot * .3)} y={230 - accumulated} width={Math.min(48, slot * .6)} height={height} fill={CHART_COLORS[i]} tabIndex={value ? 0 : undefined} aria-label={`${monthLabel(row.month)}, ${labels[i]}: ${value}`} onMouseEnter={() => setHover({ month: row.month, index: i, value, left: x / 7 })} onFocus={() => setHover({ month: row.month, index: i, value, left: x / 7 })} onBlur={() => setHover(null)} onClick={() => setHover({ month: row.month, index: i, value, left: x / 7 })} />; })}{(rows.length <= 7 || index % Math.ceil(rows.length / 6) === 0 || index === rows.length - 1) && <text x={x} y="260" textAnchor="middle" className="ac-axis">{monthLabel(row.month)}</text>}</g>; })}
  </svg>{hover && <Tooltip title={monthLabel(hover.month)} value={`${labels[hover.index]}: ${hover.value}`} left={hover.left} />}</div><Legend rows={labels.map((l, i) => [l, rows.reduce((sum, row) => sum + (row.values[i] || 0), 0)])} /></>;
}
function Legend({ rows }: { rows: ChartRow[] }) { return <ul className="ac-legend">{rows.map(([label, value], i) => <li key={label}><i style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} /><span>{label}</span><strong>{value.toLocaleString()}</strong></li>)}</ul>; }
export function DonutChart({ rows, label }: { rows: ChartRow[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null); const total = rows.reduce((sum, r) => sum + r[1], 0); let offset = 0;
  if (!total) return <p className="ac-empty">No records for this period.</p>;
  return <div className="ac-donut-layout"><div className="ac-chart ac-donut"><svg viewBox="0 0 240 240" role="group" aria-label={label}><circle cx="120" cy="120" r="80" fill="none" stroke="#f0edf7" strokeWidth="32" />{rows.map(([name, value], i) => { const length = value / total * 100; const start = offset; offset += length; return value ? <circle key={name} cx="120" cy="120" r="80" fill="none" stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={hover === i ? 38 : 32} pathLength="100" strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} transform="rotate(-90 120 120)" tabIndex={0} aria-label={`${name}: ${value} (${Math.round(value / total * 100)}%)`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} onClick={() => setHover(i)} /> : null; })}<text x="120" y="117" textAnchor="middle" className="ac-donut-number">{total}</text><text x="120" y="142" textAnchor="middle" className="ac-axis">Total</text></svg>{hover !== null && <Tooltip title={rows[hover][0]} value={`${rows[hover][1]} (${Math.round(rows[hover][1] / total * 100)}%)`} left={50} top={0} />}</div><Legend rows={rows} /></div>;
}
export function FunnelChart({ rows }: { rows: ChartRow[] }) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return <div className="ac-funnel">{rows.map(([name, value], i) => <div className="ac-funnel-row" key={name}><span>{name}</span><div className="ac-funnel-track"><div style={{ width: `${Math.max(16, value / max * 100)}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}><strong>{value}</strong></div></div></div>)}<p className="an-note">Counts are requests reaching each recorded milestone. Worker selection counts require at least one accepted candidate.</p></div>;
}
const FOCUS = [{ name: 'India', mapName: 'India', code: 'IN', x: 719, y: 191, color: '#a9d991' }, { name: 'United States', mapName: 'United States of America', code: 'US', x: 232, y: 148, color: '#b8cbed' }, { name: 'United Arab Emirates', mapName: 'United Arab Emirates', code: 'AE', x: 650, y: 183, color: '#f2d98d' }];
export function countryCode(country: string) {
  const value = country.toLowerCase().trim().replace(/[.]/g, '');
  if (['india', 'in', 'ind'].includes(value)) return 'IN';
  if (['usa', 'us', 'united states', 'united states of america', 'america'].includes(value)) return 'US';
  if (['uae', 'ae', 'are', 'united arab emirates'].includes(value)) return 'AE';
  return '';
}
export function WorkerWorldMap({ workers }: { workers: Worker[] }) {
  const [active, setActive] = useState<string | null>(null); const [zoom, setZoom] = useState(1); const [anchor, setAnchor] = useState({ left: 50, top: 20 });
  const unique = [...new Map(workers.map(w => [w._id, w])).values()]; const region = FOCUS.find(r => r.code === active); const members = unique.filter(w => countryCode(w.country || '') === active);
  const select = (code: string, left?: number, top?: number) => { setActive(code); setAnchor({ left: left ?? 50, top: top ?? 12 }); };
  const outside = unique.filter(w => !countryCode(w.country || '')).length;
  return <section className="db-card an-panel ac-world-panel"><h2>Workers by country</h2><p className="an-note">India, United States, and United Arab Emirates. Hover, focus, or tap a highlighted region to see your company's workers.</p><div className="ac-world-legend">{FOCUS.map(r => <button key={r.code} type="button" aria-pressed={active === r.code} onClick={() => select(r.code)}><i style={{ background: r.color }} />{r.name}<strong>{unique.filter(w => countryCode(w.country || '') === r.code).length}</strong></button>)}</div>
    <div className="ac-world" onMouseLeave={() => setActive(null)} onKeyDown={e => { if (e.key === 'Escape') setActive(null); }}>
      <svg viewBox={`${500 - 500 / zoom} ${220 - 190 / zoom} ${1000 / zoom} ${380 / zoom}`} role="group" aria-label="World map highlighting India, the USA, and the UAE"><g stroke="#fff" strokeWidth=".7" strokeLinejoin="round" fillRule="evenodd">{paths.filter(p => p.name !== 'Antarctica').map(p => { const focus = FOCUS.find(r => r.mapName === p.name); return <path key={p.name} d={p.d} fill={focus ? active === focus.code ? '#1e3a8a' : focus.color : '#edf0f3'} className={focus ? 'ac-country-focus' : ''} data-country-code={focus?.code} role={focus ? 'button' : undefined} tabIndex={focus ? 0 : undefined} aria-label={focus ? `${focus.name}: ${unique.filter(w => countryCode(w.country || '') === focus.code).length} workers` : undefined} onMouseEnter={focus ? e => { const rect = e.currentTarget.ownerSVGElement!.getBoundingClientRect(); select(focus.code, (e.clientX - rect.left) / rect.width * 100, Math.max(8, e.clientY - rect.top - 125)); } : undefined} onMouseLeave={focus ? () => setActive(null) : undefined} onFocus={focus ? () => select(focus.code) : undefined} onBlur={focus ? () => setActive(null) : undefined} onClick={focus ? () => select(focus.code) : undefined} onKeyDown={focus ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(focus.code); } } : undefined} />; })}
      <circle cx="650" cy="183" r="9" className="ac-uae-target" fill="transparent" stroke="#b78629" strokeWidth="1" role="button" tabIndex={0} aria-label="United Arab Emirates workers" onMouseEnter={() => select('AE', 65, 10)} onFocus={() => select('AE')} onBlur={() => setActive(null)} onClick={() => select('AE')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select('AE'); } }} />
      </g></svg>
      {region && <div className="ac-tooltip ac-map-tooltip" role="tooltip" style={{ left: `${Math.max(20, Math.min(80, anchor.left))}%`, top: anchor.top }}><strong>{region.name}</strong><span>Workers <b>{members.length}</b></span><span>Active <b>{members.filter(w => w.status === 'active').length}</b></span><span>Roles <b>{new Set(members.map(w => w.roleTitle).filter(Boolean)).size}</b></span></div>}
      <div className="ac-map-controls"><button aria-label="Zoom in map" disabled={zoom >= 2} onClick={() => setZoom(z => Math.min(2, z + .25))}>+</button><button aria-label="Zoom out map" disabled={zoom <= 1} onClick={() => setZoom(z => Math.max(1, z - .25))}>−</button><button aria-label="Reset map zoom" onClick={() => setZoom(1)}>Reset</button></div>
    </div>{outside > 0 && <p className="an-note">{outside} worker{outside === 1 ? '' : 's'} have another or unspecified country and are not included in the three highlighted regions.</p>}
  </section>;
}
