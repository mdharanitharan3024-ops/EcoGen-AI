import { BarChart3, Leaf } from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'

const TIER_COLORS = ['#21a77a', '#4c83e6']
const money = (value) => `$${Number(value || 0).toFixed(4)}`
const energy = (value) => Number(value || 0) < 0.01
  ? `${(Number(value || 0) * 1000).toFixed(2)} Wh`
  : `${Number(value).toFixed(3)} kWh`
const duration = (value) => `${Number(value || 0).toFixed(1)}s`
const niceTier = (tier) => tier === 'eco' ? 'Eco mode' : 'High quality'

export default function AnalyticsPage({ analytics }) {
  const data = analytics?.daily || []
  const tiers = analytics?.tier_distribution || []
  return <>
    <div className="page-heading"><div><div className="eyebrow">RESOURCE REPORT</div><h1>See what you saved.</h1><p>Every number is an estimate based on the assumptions in Settings, not measured device energy or provider billing.</p></div></div>
    <div className="analytics-summary">
      <div className="analytics-lead"><span className="lead-icon"><Leaf size={18} /></span><div><span>Estimated energy saved</span><strong>{energy(analytics?.estimated_energy_saved_kwh)}</strong><small>{analytics?.energy_saved_percent ?? 0}% below maximum-quality baseline</small></div><span className="lead-decoration">{(analytics?.energy_saved_percent ?? 0).toFixed(0)}<i>%</i></span></div>
      <div className="analytics-mini"><span>Total images</span><strong>{analytics?.total_generations ?? 0}</strong><small>All saved generations</small></div>
      <div className="analytics-mini"><span>Compute time saved</span><strong>{duration(analytics?.estimated_compute_seconds_saved)}</strong><small>Compared with high quality</small></div>
      <div className="analytics-mini"><span>Est. electricity cost</span><strong>{money(analytics?.estimated_cost_usd)}</strong><small>Excludes provider charges</small></div>
    </div>
    <div className="chart-grid"><section className="chart-panel panel"><div className="chart-heading"><div><h2>Energy by day</h2><p>Modeled usage and avoided baseline</p></div><span className="chart-legend"><i />Estimated energy</span></div>{data.length ? <ResponsiveContainer width="100%" height={260}><AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="energyFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#29b889" stopOpacity={0.25} /><stop offset="95%" stopColor="#29b889" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" /><XAxis dataKey="day" tickFormatter={(day) => day.slice(5)} axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text)' }} formatter={(value) => [`${(Number(value) * 1000).toFixed(2)} Wh`, 'Estimated energy']} /><Area type="monotone" dataKey="energy_kwh" stroke="#1ca67b" strokeWidth={2.5} fill="url(#energyFill)" /></AreaChart></ResponsiveContainer> : <ChartEmpty />}</section>
      <section className="chart-panel panel"><div className="chart-heading"><div><h2>Tier distribution</h2><p>How you chose to generate</p></div></div>{tiers.length ? <div className="tier-chart"><ResponsiveContainer width="100%" height={210}><PieChart><Pie data={tiers} dataKey="count" nameKey="tier" innerRadius={58} outerRadius={82} paddingAngle={5} stroke="none">{tiers.map((entry, index) => <Cell key={entry.tier} fill={TIER_COLORS[index % TIER_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, color: 'var(--text)' }} formatter={(value, _name, item) => [value, niceTier(item.payload.tier)]} /></PieChart></ResponsiveContainer><div className="tier-legend">{tiers.map((entry, index) => <div key={entry.tier}><i style={{ background: TIER_COLORS[index % TIER_COLORS.length] }} /><span>{niceTier(entry.tier)}</span><strong>{entry.count}</strong></div>)}</div></div> : <ChartEmpty />}</section></div>
    <div className="analytics-note"><div className="info-mark">i</div><p><strong>How we calculate:</strong> image pixels × configured seconds per megapixel × tier factor estimates compute time. Estimated energy multiplies that time by assumed device watts. Electricity cost uses your configured price per kWh. This is a comparison model, not provider telemetry or a carbon accounting claim.</p></div>
  </>
}

function ChartEmpty() { return <div className="chart-empty"><BarChart3 size={22} /><span>Generate images to see your trends.</span></div> }
