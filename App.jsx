import { lazy, Suspense, useEffect, useState } from 'react'
import {
  Activity, ArrowDownToLine, ArrowRight, BarChart3, Check, ChevronDown, Clock3,
  Compass, ImagePlus, Leaf, LoaderCircle, Menu, Moon, MoreHorizontal, Plus,
  Search, Settings2, Sparkles, Sun, Trash2, WandSparkles, X,
} from 'lucide-react'
import { api } from './services/api.js'

const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'))

const NAV = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'create', label: 'Create image', icon: ImagePlus },
  { id: 'history', label: 'History', icon: Clock3 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]
const STYLES = ['None', 'Editorial', 'Watercolor', 'Line art', '3D render', 'Vintage print']
const RATIOS = ['1:1', '4:3', '3:2', '16:9', '9:16']
const SUGGESTIONS = [
  'A printable worksheet showing the life cycle of a butterfly',
  'A bold, colorful community garden festival poster',
  'Simple outline illustration of three native wildflowers',
]

function money(value) {
  return `$${Number(value || 0).toFixed(4)}`
}
function energy(value) {
  if (Number(value || 0) < 0.01) return `${(Number(value || 0) * 1000).toFixed(2)} Wh`
  return `${Number(value).toFixed(3)} kWh`
}
function duration(value) {
  return `${Number(value || 0).toFixed(1)}s`
}
function niceTier(tier) {
  return tier === 'eco' ? 'Eco mode' : 'High quality'
}

export default function App() {
  const [view, setView] = useState('overview')
  const [dark, setDark] = useState(localStorage.getItem('ecogen-dark') === 'true')
  const [mobileNav, setMobileNav] = useState(false)
  const [history, setHistory] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [settings, setSettings] = useState(null)
  const [health, setHealth] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [lastGeneration, setLastGeneration] = useState(null)
  const [form, setForm] = useState({ prompt: '', negative_prompt: '', tier: 'eco', style: 'None', aspect_ratio: '1:1' })

  const loadDashboard = async () => {
    try {
      const [healthResult, historyResult, analyticsResult, settingsResult] = await Promise.all([
        api.health(), api.history(), api.analytics(), api.settings(),
      ])
      setHealth(healthResult.status === 'ok')
      setHistory(historyResult.generations)
      setAnalytics(analyticsResult)
      setSettings(settingsResult)
      setError('')
    } catch (err) {
      setHealth(false)
      setError(err.message)
    }
  }

  useEffect(() => { loadDashboard() }, [])
  useEffect(() => {
    if (view !== 'history') return
    const timer = window.setTimeout(async () => {
      try {
        const result = await api.history(search, filterTier)
        setHistory(result.generations)
      } catch (err) { setError(err.message) }
    }, 180)
    return () => window.clearTimeout(timer)
  }, [view, search, filterTier])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selectView = (next) => {
    setView(next)
    setMobileNav(false)
    setError('')
  }
  const toggleDark = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('ecogen-dark', String(next))
  }
  const setField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))
  const recommend = form.prompt.length > 4 && /poster|color|colour|detailed|landscape|cover|brand/i.test(form.prompt)
    ? 'high_quality' : 'eco'
  const generate = async (override = form) => {
    if (!override.prompt.trim()) {
      setError('Add a prompt before generating an image.')
      return
    }
    setBusy(true)
    setError('')
    const started = performance.now()
    try {
      const result = await api.generate(override)
      setLastGeneration({ ...result.generation, estimates: result.estimates, elapsed: (performance.now() - started) / 1000 })
      setToast('Image generated and saved to your history.')
      await loadDashboard()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  const regenerate = (item) => {
    const next = {
      prompt: item.prompt,
      negative_prompt: item.negative_prompt,
      tier: item.tier,
      style: item.style,
      aspect_ratio: item.aspect_ratio,
    }
    setForm(next)
    setView('create')
    setError('')
    setLastGeneration(null)
  }
  const deleteItem = async (id) => {
    try {
      await api.remove(id)
      setHistory((items) => items.filter((item) => item.id !== id))
      setToast('Generation deleted.')
      await loadDashboard()
    } catch (err) { setError(err.message) }
  }
  const saveSettings = async (event) => {
    event.preventDefault()
    try {
      const saved = await api.saveSettings(settings)
      setSettings(saved)
      setToast('Preferences saved.')
    } catch (err) { setError(err.message) }
  }

  return (
    <div className={`app-shell ${dark ? 'theme-dark' : ''}`}>
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand"><span className="brand-mark"><Leaf size={20} /></span><span>ecogen<span className="brand-ai">AI</span></span></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? 'nav-active' : ''}`} onClick={() => selectView(id)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'history' && history.length > 0 && <span className="nav-count">{history.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-note">
          <div className="note-icon"><Activity size={17} /></div>
          <div><strong>Less compute. More intent.</strong><p>Choose just enough detail for the job.</p></div>
        </div>
        <div className="account-row"><div className="avatar">E</div><div className="account-copy"><strong>EcoGen workspace</strong><span>Local project</span></div><MoreHorizontal size={18} /></div>
      </aside>
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={19} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{NAV.find((item) => item.id === view)?.label}</strong></div>
          <div className="top-actions"><span className={`service-status ${health ? 'online' : ''}`}><i />{health ? 'API connected' : 'API unavailable'}</span><button className="icon-button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleDark}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><div className="top-avatar">E</div></div>
        </header>
        <div className="page-content">
          {error && <div className="error-banner" role="alert"><span>{error}</span><button aria-label="Dismiss error" onClick={() => setError('')}><X size={16} /></button></div>}
          {view === 'overview' && <Overview analytics={analytics} history={history} onCreate={() => selectView('create')} onHistory={() => selectView('history')} />}
          {view === 'create' && <CreatePage form={form} setField={setField} recommend={recommend} busy={busy} generate={generate} lastGeneration={lastGeneration} />}
          {view === 'history' && <HistoryPage history={history} search={search} setSearch={setSearch} filterTier={filterTier} setFilterTier={setFilterTier} regenerate={regenerate} deleteItem={deleteItem} />}
          {view === 'analytics' && <Suspense fallback={<div className="panel settings-loading"><LoaderCircle size={20} className="spin" />Loading analytics…</div>}><AnalyticsPage analytics={analytics} /></Suspense>}
          {view === 'settings' && <SettingsPage settings={settings} setSettings={setSettings} saveSettings={saveSettings} />}
        </div>
      </main>
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  )
}

function PageTitle({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Overview({ analytics, history, onCreate, onHistory }) {
  const metrics = [
    { label: 'Images generated', value: analytics?.total_generations ?? '—', detail: 'Saved in this workspace', icon: ImagePlus, tone: 'blue' },
    { label: 'Estimated energy saved', value: analytics ? energy(analytics.estimated_energy_saved_kwh) : '—', detail: 'vs. high-quality baseline', icon: Leaf, tone: 'green' },
    { label: 'Compute time saved', value: analytics ? duration(analytics.estimated_compute_seconds_saved) : '—', detail: 'Modeled, not provider telemetry', icon: Clock3, tone: 'mint' },
    { label: 'Estimated energy cost', value: analytics ? money(analytics.estimated_cost_usd) : '—', detail: 'Electricity estimate only', icon: Activity, tone: 'blue' },
  ]
  return <>
    <PageTitle eyebrow="RESOURCE-AWARE IMAGE STUDIO" title="Create with intention." description="Match the computational effort to what your image needs to do." action={<button className="button button-primary" onClick={onCreate}><Plus size={17} />New image</button>} />
    <section className="welcome-band">
      <div className="welcome-copy"><span className="welcome-kicker"><Sparkles size={14} /> A lighter way to make</span><h2>Good images start<br />with the right amount.</h2><p>Pick a purpose-built quality tier. Eco mode keeps simple visuals simple; high quality brings the detail when it matters.</p><button className="button button-light" onClick={onCreate}>Start creating <ArrowRight size={16} /></button></div>
      <div className="welcome-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-core"><Leaf size={44} strokeWidth={1.3} /></div><span className="art-dot dot-one" /><span className="art-dot dot-two" /><span className="art-dot dot-three" /><span className="art-caption">INTENT → EFFORT</span></div>
      <div className="welcome-index">01 <span>/</span> 03</div>
    </section>
    <div className="metric-grid">{metrics.map(({ label, value, detail, icon: Icon, tone }, index) => <div className={`metric-card enter-delay-${index + 1}`} key={label}><div className={`metric-icon ${tone}`}><Icon size={18} /></div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></div>)}</div>
    <div className="section-head"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>Recent generations</h2></div><button className="text-button" onClick={onHistory}>View history <ArrowRight size={15} /></button></div>
    {history.length ? <div className="recent-grid">{history.slice(0, 3).map((item) => <GenerationCard key={item.id} item={item} compact />)}</div> : <EmptyState title="Your first image is one prompt away" text="Generated images and their resource comparisons will appear here." action={onCreate} />}
    <div className="estimate-footnote"><span className="info-mark">i</span><p>All energy, time and cost figures are transparent model-based estimates, not measured usage or Cloudflare billing. Open <strong>Settings</strong> to review assumptions.</p></div>
  </>
}

function CreatePage({ form, setField, recommend, busy, generate, lastGeneration }) {
  const presetPrompt = (prompt) => setField('prompt', prompt)
  return <>
    <PageTitle eyebrow="IMAGE GENERATOR" title="Bring an idea to life." description="Choose a visual direction, then spend detail where it counts." />
    <div className="create-layout">
      <section className="composer panel">
        <div className="panel-heading"><div><h2>Describe your image</h2><p>Be clear about subject, purpose and visual style.</p></div><span className="step-label">01 <span>/</span> 02</span></div>
        <label className="field-label" htmlFor="prompt">Prompt <span className="required">*</span></label>
        <textarea id="prompt" className="prompt-input" maxLength={1000} value={form.prompt} onChange={(event) => setField('prompt', event.target.value)} placeholder="A simple line-art worksheet showing the stages of a sunflower..." />
        <div className="input-meta"><span>Describe what should appear in the image</span><span>{form.prompt.length}/1000</span></div>
        <label className="field-label negative-label" htmlFor="negative">Negative prompt <span className="optional">OPTIONAL</span></label>
        <input id="negative" className="text-input" maxLength={500} value={form.negative_prompt} onChange={(event) => setField('negative_prompt', event.target.value)} placeholder="Things to avoid, e.g. text, watermark, blurry edges" />
        <div className="suggestion-head"><span className="field-label">Need a starting point?</span><Sparkles size={15} /></div>
        <div className="suggestions">{SUGGESTIONS.map((suggestion) => <button key={suggestion} onClick={() => presetPrompt(suggestion)}>{suggestion}<ArrowRight size={13} /></button>)}</div>
        <div className="form-divider" />
        <div className="field-label">Choose a quality tier</div>
        <div className="tier-options">
          <button className={`tier-option ${form.tier === 'eco' ? 'tier-selected' : ''}`} onClick={() => setField('tier', 'eco')}><span className="tier-radio" /><span className="tier-text"><strong><Leaf size={15} /> Eco mode</strong><small>Sketches, outlines, worksheets</small><em>Lower modeled compute</em></span>{recommend === 'eco' && <span className="recommended-tag">RECOMMENDED</span>}</button>
          <button className={`tier-option ${form.tier === 'high_quality' ? 'tier-selected' : ''}`} onClick={() => setField('tier', 'high_quality')}><span className="tier-radio" /><span className="tier-text"><strong><Sparkles size={15} /> High quality</strong><small>Detailed, colorful posters</small><em>Maximum-quality baseline</em></span>{recommend === 'high_quality' && <span className="recommended-tag">RECOMMENDED</span>}</button>
        </div>
        <div className="recommendation"><WandSparkles size={15} /><span>Prompt analysis recommends <strong>{niceTier(recommend)}</strong>. Change tiers any time.</span></div>
        <div className="option-row">
          <div className="option-field"><label className="field-label" htmlFor="style">Style preset</label><div className="select-wrap"><select id="style" value={form.style} onChange={(event) => setField('style', event.target.value)}>{STYLES.map((style) => <option key={style}>{style}</option>)}</select><ChevronDown size={15} /></div></div>
          <div className="option-field"><span className="field-label">Aspect ratio</span><div className="ratio-options">{RATIOS.map((ratio) => <button key={ratio} className={form.aspect_ratio === ratio ? 'ratio-selected' : ''} onClick={() => setField('aspect_ratio', ratio)}>{ratio}</button>)}</div></div>
        </div>
        <button className="button button-primary generate-button" disabled={busy || !form.prompt.trim()} onClick={() => generate()}>{busy ? <><LoaderCircle size={17} className="spin" />Contacting Cloudflare AI…</> : <><Sparkles size={17} />Generate image</>}</button>
        <div className="privacy-note"><span className="secure-dot" />Your prompt is sent to Cloudflare Workers AI for image generation.</div>
      </section>
      <section className="preview-column">
        <div className="preview-panel panel">
          <div className="preview-topline"><span>PREVIEW</span><span>{lastGeneration ? niceTier(lastGeneration.tier) : 'AWAITING GENERATION'}</span></div>
          {busy ? <div className="preview-empty preview-loading"><div className="loader-orbit"><span /><span /><span /></div><h3>Creating your image</h3><p>Waiting for the Cloudflare AI response.<br />This may take a little while.</p><div className="progress-track"><span /></div><small>Live request · no simulated progress</small></div> : lastGeneration ? <div className="image-result"><img src={lastGeneration.image_url} alt={lastGeneration.prompt} /><div className="result-actions"><a className="button button-primary button-small" href={lastGeneration.image_url} download><ArrowDownToLine size={15} />Download</a><button className="button button-outline button-small" onClick={() => generate()}><WandSparkles size={15} />Regenerate</button></div></div> : <div className="preview-empty"><div className="empty-image-icon"><ImagePlus size={25} /></div><h3>Your image will appear here</h3><p>Write a prompt and select the level of detail<br />that fits its purpose.</p><div className="preview-skeleton"><span /><span /><span /></div></div>}
        </div>
        {lastGeneration && <div className="comparison-card panel"><div className="comparison-title"><div><span className="eyebrow">RESOURCE COMPARISON</span><h3>This generation vs. maximum quality</h3></div><span className="saved-pill">{lastGeneration.saved_percent}% less</span></div><div className="comparison-bars"><ComparisonRow label="Current · " tier={niceTier(lastGeneration.tier)} energyValue={lastGeneration.energy_kwh} compute={lastGeneration.compute_seconds} max={lastGeneration.baseline_energy_kwh} /><ComparisonRow label="Baseline · " tier="High quality" energyValue={lastGeneration.baseline_energy_kwh} compute={lastGeneration.baseline_seconds} max={lastGeneration.baseline_energy_kwh} /></div><div className="comparison-footer"><span>Est. energy <strong>{energy(lastGeneration.energy_kwh)}</strong></span><span>Est. compute <strong>{duration(lastGeneration.compute_seconds)}</strong></span><span>Est. electricity <strong>{money(lastGeneration.cost_usd)}</strong></span></div><p className="estimate-disclaimer">Modeled estimate only. Actual generation time and provider charges may differ.</p></div>}
      </section>
    </div>
  </>
}

function ComparisonRow({ label, tier, energyValue, compute, max }) {
  const ratio = max ? Math.max(8, Number(energyValue) / Number(max) * 100) : 0
  return <div className="comparison-row"><span>{label}<strong>{tier}</strong></span><div className="compare-track"><i style={{ width: `${ratio}%` }} /></div><b>{energy(energyValue)}</b><small>{duration(compute)}</small></div>
}

function GenerationCard({ item, compact = false, regenerate, deleteItem }) {
  return <article className={`generation-card ${compact ? 'generation-compact' : ''}`}>
    <div className="generation-image"><img src={item.image_url} alt={item.prompt} loading="lazy" /><span className={`tier-badge ${item.tier}`}>{item.tier === 'eco' ? <Leaf size={12} /> : <Sparkles size={12} />}{niceTier(item.tier)}</span></div>
    <div className="generation-info"><p className="generation-prompt">{item.prompt}</p><div className="generation-meta"><span>{new Date(item.created_at).toLocaleDateString()}</span><span>{item.aspect_ratio}</span><span>{energy(item.energy_kwh)}</span></div><div className="generation-savings"><span><Leaf size={13} />After {energy(item.energy_kwh)} / max {energy(item.baseline_energy_kwh)} · {item.saved_percent}% saved</span><span>{duration(item.compute_seconds)} compute</span></div></div>
    <div className="generation-actions"><a className="icon-button" href={item.image_url} download aria-label="Download image"><ArrowDownToLine size={16} /></a>{regenerate && <button className="icon-button" onClick={() => regenerate(item)} aria-label="Regenerate image"><WandSparkles size={16} /></button>}{deleteItem && <button className="icon-button danger-hover" onClick={() => deleteItem(item.id)} aria-label="Delete generation"><Trash2 size={16} /></button>}</div>
  </article>
}

function HistoryPage({ history, search, setSearch, filterTier, setFilterTier, regenerate, deleteItem }) {
  return <>
    <PageTitle eyebrow="YOUR LIBRARY" title="Generation history." description="Revisit prompts, compare resource estimates, or make another version." action={<span className="history-total">{history.length} results</span>} />
    <div className="history-toolbar"><label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prompts or styles" /></label><div className="filter-select"><select value={filterTier} onChange={(event) => setFilterTier(event.target.value)}><option value="">All tiers</option><option value="eco">Eco mode</option><option value="high_quality">High quality</option></select><ChevronDown size={15} /></div></div>
    {history.length ? <div className="history-list">{history.map((item) => <GenerationCard key={item.id} item={item} regenerate={regenerate} deleteItem={deleteItem} />)}</div> : <EmptyState title="No matching generations" text="Try a different search, or create your first image." action={() => { setSearch(''); setFilterTier('') }} label="Clear filters" />}
  </>
}

function SettingsPage({ settings, setSettings, saveSettings }) {
  if (!settings) return <div className="panel settings-loading"><LoaderCircle size={20} className="spin" />Loading settings…</div>
  const update = (key, value) => setSettings((previous) => ({ ...previous, [key]: value }))
  return <>
    <PageTitle eyebrow="PREFERENCES & ASSUMPTIONS" title="Make the model yours." description="Adjust the estimate inputs and default behavior used for future generations." />
    <form className="settings-layout" onSubmit={saveSettings}>
      <section className="settings-section panel"><div className="settings-section-title"><div className="settings-section-icon"><SlidersIcon /></div><div><h2>Resource assumptions</h2><p>These values make estimates transparent and configurable.</p></div></div><div className="settings-fields">
        <label><span>Assumed device power <small>Used to estimate energy from compute time.</small></span><div className="number-input"><input type="number" min="50" max="2000" step="10" value={settings.device_watts} onChange={(event) => update('device_watts', Number(event.target.value))} /><em>W</em></div></label>
        <label><span>High-quality compute per megapixel <small>Baseline duration assumption for a 1 MP image.</small></span><div className="number-input"><input type="number" min="1" max="300" step="1" value={settings.high_quality_seconds_per_megapixel} onChange={(event) => update('high_quality_seconds_per_megapixel', Number(event.target.value))} /><em>sec</em></div></label>
        <label><span>Eco mode compute factor <small>Eco estimate as a fraction of maximum-quality baseline.</small></span><div className="number-input"><input type="number" min="0.05" max="0.95" step="0.01" value={settings.eco_compute_factor} onChange={(event) => update('eco_compute_factor', Number(event.target.value))} /><em>x</em></div></label>
        <label><span>Electricity price <small>Used only for the modeled electricity cost.</small></span><div className="number-input"><em>$</em><input type="number" min="0" max="5" step="0.01" value={settings.electricity_price_per_kwh} onChange={(event) => update('electricity_price_per_kwh', Number(event.target.value))} /><em>/kWh</em></div></label>
      </div></section>
      <section className="settings-section panel"><div className="settings-section-title"><div className="settings-section-icon"><WandSparkles size={17} /></div><div><h2>Generation defaults</h2><p>Set your starting point for each new prompt.</p></div></div><div className="default-tier"><button type="button" className={settings.default_tier === 'eco' ? 'default-selected' : ''} onClick={() => update('default_tier', 'eco')}><Leaf size={16} /><span><strong>Eco mode</strong><small>Simple, lower-detail visuals</small></span><span className="tier-radio" /></button><button type="button" className={settings.default_tier === 'high_quality' ? 'default-selected' : ''} onClick={() => update('default_tier', 'high_quality')}><Sparkles size={16} /><span><strong>High quality</strong><small>Detailed, colorful imagery</small></span><span className="tier-radio" /></button></div><div className="settings-caveat"><Activity size={16} /><span>All estimates are approximations. They do not measure actual device energy or represent Cloudflare billing.</span></div><button className="button button-primary save-settings" type="submit"><Check size={16} />Save preferences</button></section>
    </form>
  </>
}
function SlidersIcon() { return <Activity size={17} /> }

function EmptyState({ title, text, action, label = 'Create an image' }) {
  return <div className="empty-state"><span className="empty-state-mark"><ImagePlus size={21} /></span><h3>{title}</h3><p>{text}</p><button className="button button-outline" onClick={action}>{label}<ArrowRight size={15} /></button></div>
}
