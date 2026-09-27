import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { MainTaskPretestPage } from './pretests/main/MainTaskPretestPage'
import { SubTaskPretestPage } from './pretests/sub/SubTaskPretestPage'
import './style.css'

export type Status = '未开始' | '进行中' | '已完成'
type RunStatus = '待开始' | '进行中' | '已暂停'
type Support = 'N0' | 'N1' | 'N2' | 'N3' | 'N4'
type Conditions = { intervention: string; modality: string; support: Support | '' }
type FormalSession = { participantId: string; conditions: Conditions; status: RunStatus }
type FormalRecord = {
  participantId: string; trialId: string; intervention: string; modality: string
  support: Support; supportName: string; completedAt: string; status: '已完成'
  mainTaskResult: string; subTaskResult: string; attentionReturnResult: string
}
type SavedState = {
  participantId: string
  pretestStatuses: Record<string, Status>
  pretestParams: Record<string, Record<string, string>>
  conditions: Conditions
  activeFormal: FormalSession | null
  formalRecords: FormalRecord[]
}
export type Platform = { state: SavedState; setState: React.Dispatch<React.SetStateAction<SavedState>> }

const pretests = [
  { id: 'PT-01', slug: 'main-task', name: '主任务预实验', description: '熟悉持续动态目标跟踪主任务。', purpose: '熟悉持续动态目标跟踪主任务，并调整主任务参数。' },
  { id: 'PT-02', slug: 'sub-task', name: '次任务预实验', description: '熟悉UAV突发次任务。', purpose: '熟悉 UAV 突发次任务，并调节次任务难度和时间限制。' },
  { id: 'PT-03', slug: 'combined-task', name: '主次任务组合预实验', description: '熟悉主任务持续运行、次任务随机插入的双任务流程。', purpose: '熟悉主任务持续运行、次任务随机出现以及完成次任务后继续主任务。' },
  { id: 'PT-04', slug: 'support', name: '主任务注意再分配支持预实验', description: '熟悉N0-N4支持策略的表现形式。', purpose: '熟悉 N0–N4 支持策略的表现形式与区别。' },
] as const
type Pretest = typeof pretests[number]
const supports: { id: Support; name: string; mechanism: string; detail: string }[] = [
  { id: 'N0', name: '无支持', mechanism: '无额外支持', detail: '次任务出现、处理和完成后，系统不额外提供主任务支持。' },
  { id: 'N1', name: '迁移前支持', mechanism: '任务状态外化', detail: '注意从主任务转向次任务之前，允许对当前主任务状态进行一次轻量标记。' },
  { id: 'N2', name: '注意占用期支持', mechanism: '主任务线索保持', detail: '处理次任务期间，主任务以低显著方式持续存在。' },
  { id: 'N3', name: '注意回归期支持', mechanism: '上下文重建', detail: '次任务完成后，提供短暂的主任务连续性辅助线索。' },
  { id: 'N4', name: '全过程支持', mechanism: 'N1 + N2 + N3', detail: '组合迁移前任务状态外化、注意占用期主任务线索保持与注意回归期上下文重建。' },
]
const emptyState: SavedState = {
  participantId: '', pretestStatuses: {}, pretestParams: {},
  conditions: { intervention: '', modality: '', support: '' }, activeFormal: null, formalRecords: [],
}
function readSaved(): SavedState {
  try {
    const raw = localStorage.getItem('attention-platform-single-page-v1')
    if (!raw) return emptyState
    const parsed = JSON.parse(raw) as Partial<SavedState>
    return {
      participantId: typeof parsed.participantId === 'string' ? parsed.participantId : '',
      pretestStatuses: parsed.pretestStatuses && typeof parsed.pretestStatuses === 'object' ? parsed.pretestStatuses : {},
      pretestParams: parsed.pretestParams && typeof parsed.pretestParams === 'object' ? parsed.pretestParams : {},
      conditions: { ...emptyState.conditions, ...parsed.conditions },
      activeFormal: parsed.activeFormal ?? null,
      formalRecords: Array.isArray(parsed.formalRecords) ? parsed.formalRecords : [],
    }
  } catch { return emptyState }
}
function usePlatform(): Platform {
  const [state, setState] = useState<SavedState>(readSaved)
  useEffect(() => { localStorage.setItem('attention-platform-single-page-v1', JSON.stringify(state)) }, [state])
  return { state, setState }
}
function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status-${status === '已完成' ? 'done' : status === '进行中' ? 'running' : 'idle'}`}><i />{status}</span>
}
function conditionText(conditions: Conditions) {
  const support = supports.find(item => item.id === conditions.support)
  return conditions.intervention && conditions.modality && support
    ? `${conditions.intervention} × ${conditions.modality} × ${support.id} ${support.name}` : ''
}
function download(filename: string, body: string, mime: string, bom = false) {
  const url = URL.createObjectURL(new Blob([bom ? '\uFEFF' : '', body], { type: mime }))
  const link = document.createElement('a'); link.href = url; link.download = filename
  document.body.appendChild(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const csvColumns: { key: keyof FormalRecord; title: string }[] = [
  { key: 'participantId', title: '被试编号' }, { key: 'trialId', title: 'trial编号' },
  { key: 'intervention', title: '次任务介入方式' }, { key: 'modality', title: '提示模态' },
  { key: 'support', title: 'N条件' }, { key: 'supportName', title: '支持策略' },
  { key: 'mainTaskResult', title: '主任务相关结果' }, { key: 'subTaskResult', title: '次任务相关结果' },
  { key: 'attentionReturnResult', title: '注意回归相关结果' }, { key: 'completedAt', title: '完成时间' },
  { key: 'status', title: '完成状态' },
]
function exportRecords(records: FormalRecord[], participantId: string, format: 'csv' | 'json') {
  if (!records.length) return
  const name = `participant_${participantId.replace(/[^a-zA-Z0-9_-]/g, '_')}_formal.${format}`
  if (format === 'json') { download(name, JSON.stringify(records, null, 2), 'application/json;charset=utf-8'); return }
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const lines = [csvColumns.map(column => escape(column.title)).join(','), ...records.map(record => csvColumns.map(column => escape(String(record[column.key]))).join(','))]
  download(name, lines.join('\r\n'), 'text/csv;charset=utf-8', true)
}

function Home({ state, setState }: Platform) {
  const navigate = useNavigate()
  const location = useLocation()
  const [validation, setValidation] = useState('')
  const participantId = state.participantId.trim()
  const currentRecords = state.formalRecords.filter(record => record.participantId === participantId && participantId !== '')
  const latest = currentRecords.at(-1)
  useEffect(() => { if (location.hash === '#results') document.getElementById('results')?.scrollIntoView({ block: 'start' }) }, [location.hash])
  function selectCondition(field: keyof Conditions, value: string) {
    setState(previous => ({ ...previous, conditions: { ...previous.conditions, [field]: value } }))
    setValidation('')
  }
  function startFormal() {
    if (!participantId) { setValidation('请填写被试编号。'); return }
    if (!conditionText(state.conditions)) { setValidation('请完成实验条件配置。'); return }
    setValidation('')
    setState(previous => ({ ...previous, activeFormal: { participantId, conditions: { ...previous.conditions }, status: '待开始' } }))
    navigate('/formal/run')
  }
  return <main className="page home-page">
    <header className="title-area"><h1>有人车—多无人机协同前出侦察</h1><p>注意力分配实验 · 原型</p></header>

    <section className="block participant-block" aria-labelledby="participant-heading"><div className="block-heading"><div><span className="section-number">01 / PARTICIPANT</span><h2 id="participant-heading">被试编号</h2></div></div><label className="participant-field"><span className="sr-only">被试编号</span><input value={state.participantId} onChange={event => { setState(previous => ({ ...previous, participantId: event.target.value })); setValidation('') }} placeholder="P001" autoComplete="off" /></label></section>

    <section className="block pretest-block" aria-labelledby="pretest-heading"><div className="block-heading"><div><span className="section-number">02 / PRE-EXPERIMENT</span><h2 id="pretest-heading">预实验训练</h2></div><p>熟悉任务与支持策略，不记录正式实验结果。</p></div><div className="pretest-list">{pretests.map(item => <div className="pretest-row" key={item.id}><span className="module-code">{item.id}</span><div className="module-copy"><h3>{item.name}</h3><p>{item.description}</p></div><StatusBadge status={state.pretestStatuses[item.id] || '未开始'} /><Link className="small-button" to={'/pretest/' + item.slug}>进入 <span aria-hidden="true">↗</span></Link></div>)}</div><div className="pretest-footer"><Link className="button button-primary" to="/pretest/main-task">开始预实验训练 <span aria-hidden="true">↗</span></Link><button className="button button-quiet" onClick={() => document.getElementById('formal')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>跳过预实验</button></div></section>

    <section id="formal" className="block formal-block" aria-labelledby="formal-heading"><div className="block-heading"><div><span className="section-number">03 / FORMAL EXPERIMENT</span><h2 id="formal-heading">正式实验</h2></div><p>配置实验条件后开始正式实验</p></div><div className="condition-rows">
      <div className="condition-row"><div className="condition-label"><strong>次任务介入方式</strong><small>二选一</small></div><div className="option-group" role="group" aria-label="次任务介入方式">{['直接介入', '注意引导'].map(value => <button key={value} type="button" className={'option' + (state.conditions.intervention === value ? ' selected' : '')} aria-pressed={state.conditions.intervention === value} onClick={() => selectCondition('intervention', value)}>{value}</button>)}</div></div>
      <div className="condition-row"><div className="condition-label"><strong>提示模态</strong><small>二选一</small></div><div className="option-group" role="group" aria-label="提示模态">{['视觉', '视觉+听觉'].map(value => <button key={value} type="button" className={'option' + (state.conditions.modality === value ? ' selected' : '')} aria-pressed={state.conditions.modality === value} onClick={() => selectCondition('modality', value)}>{value}</button>)}</div></div>
      <div className="condition-row"><div className="condition-label"><strong>主任务注意再分配支持</strong><small>五选一</small></div><div className="option-group support-group" role="group" aria-label="主任务注意再分配支持">{supports.map(value => <button key={value.id} type="button" className={'option' + (state.conditions.support === value.id ? ' selected' : '')} aria-pressed={state.conditions.support === value.id} title={value.detail} onClick={() => selectCondition('support', value.id)}><span>{value.id}</span> {value.name}</button>)}</div></div>
    </div><div className="condition-summary"><span>当前实验条件</span><strong>{conditionText(state.conditions) || '请完成实验条件配置'}</strong></div>{validation && <p className="validation" role="alert">{validation}</p>}<div className="formal-footer"><button className="button button-primary large" onClick={startFormal}>开始正式实验 <span aria-hidden="true">↗</span></button></div></section>

    <section id="results" className="block results-block" aria-labelledby="results-heading"><div className="block-heading"><div><span className="section-number">04 / FORMAL RESULTS</span><h2 id="results-heading">正式实验结果</h2></div><p>仅显示当前被试的正式实验模拟数据。</p></div><div className="results-grid"><div><span>当前被试编号</span><strong>{participantId || '—'}</strong></div><div><span>已完成正式实验次数</span><strong>{currentRecords.length}</strong></div><div><span>最近一次实验条件</span><strong>{latest ? `${latest.intervention} × ${latest.modality} × ${latest.support} ${latest.supportName}` : '—'}</strong></div><div><span>最近一次实验完成状态</span><strong>{latest?.status || '—'}</strong></div></div>{!currentRecords.length && <div className="no-data">暂无正式实验数据</div>}<div className="results-footer"><button className="button button-secondary" disabled={!currentRecords.length} onClick={() => exportRecords(currentRecords, participantId, 'csv')}>导出CSV <span aria-hidden="true">↓</span></button><button className="button button-secondary" disabled={!currentRecords.length} onClick={() => exportRecords(currentRecords, participantId, 'json')}>导出JSON <span aria-hidden="true">↓</span></button></div></section>
  </main>
}

type Param = { key: string; label: string; type: 'number' | 'select' | 'text'; initial: string; options?: string[] }
const parameterSets: Record<string, { title: string; params: Param[] }[]> = {
  'main-task': [{ title: '主任务参数', params: [
    { key: 'total', label: '动态目标总数', type: 'number', initial: '12' },
    { key: 'targets', label: '重点跟踪目标数量', type: 'number', initial: '4' },
    { key: 'speed', label: '目标速度', type: 'select', initial: '中', options: ['低', '中', '高'] },
    { key: 'area', label: '目标运动区域', type: 'select', initial: '标准区域', options: ['标准区域', '扩大区域'] },
    { key: 'randomness', label: '目标运动随机性', type: 'select', initial: '中', options: ['低', '中', '高'] },
    { key: 'duration', label: '单轮任务时长（秒）', type: 'number', initial: '60' },
    { key: 'collision', label: '目标碰撞或避让规则', type: 'select', initial: '避让', options: ['避让', '允许碰撞'] },
  ] }],
  'sub-task': [{ title: '次任务参数', params: [
    { key: 'type', label: '次任务类型', type: 'select', initial: '信息判断', options: ['信息判断', '选项决策'] },
    { key: 'options', label: '选项数量', type: 'number', initial: '4' },
    { key: 'limit', label: '限时时长（秒）', type: 'number', initial: '15' },
    { key: 'volume', label: '任务信息量', type: 'select', initial: '中', options: ['低', '中', '高'] },
    { key: 'complexity', label: '任务复杂度', type: 'select', initial: '中', options: ['低', '中', '高'] },
    { key: 'image', label: '是否包含图像', type: 'select', initial: '是', options: ['是', '否'] },
    { key: 'text', label: '是否包含文字', type: 'select', initial: '是', options: ['是', '否'] },
    { key: 'map', label: '是否包含地图信息', type: 'select', initial: '否', options: ['是', '否'] },
  ] }],
  'combined-task': [
    { title: '主任务参数', params: [
      { key: 'mainTotal', label: '动态目标数', type: 'number', initial: '12' },
      { key: 'mainTargets', label: '重点目标数', type: 'number', initial: '4' },
      { key: 'mainSpeed', label: '速度', type: 'select', initial: '中', options: ['低', '中', '高'] },
      { key: 'mainDuration', label: '主任务时长（秒）', type: 'number', initial: '60' },
    ] },
    { title: '次任务参数', params: [
      { key: 'subType', label: '次任务类型', type: 'select', initial: '信息判断', options: ['信息判断', '选项决策'] },
      { key: 'subLimit', label: '限时时长（秒）', type: 'number', initial: '15' },
      { key: 'subCount', label: '次任务出现次数', type: 'number', initial: '2' },
      { key: 'insertRange', label: '次任务插入时间范围（秒）', type: 'text', initial: '15–45' },
    ] },
  ],
}
function Preview({ title, detail }: { title: string; detail: string }) {
  return <div className="experiment-preview"><span className="preview-corner">EXPERIMENT AREA / PLACEHOLDER</span><div><span className="preview-symbol">◎</span><strong>{title}</strong><small>{detail}</small></div></div>
}
function ParameterControls({ item, state, setState }: { item: Pretest } & Platform) {
  return <div className="parameter-groups">{parameterSets[item.slug]?.map(group => <div className="parameter-group" key={group.title}><h3>{group.title}</h3><div className="parameter-grid">{group.params.map(param => {
    const value = state.pretestParams[item.id]?.[param.key] ?? param.initial
    const onChange = (next: string) => setState(previous => ({ ...previous, pretestParams: { ...previous.pretestParams, [item.id]: { ...previous.pretestParams[item.id], [param.key]: next } } }))
    return <label key={param.key}><span>{param.label}</span>{param.type === 'select' ? <select value={value} onChange={event => onChange(event.target.value)}>{param.options?.map(option => <option key={option}>{option}</option>)}</select> : <input type={param.type} min={param.type === 'number' ? 1 : undefined} value={value} onChange={event => onChange(event.target.value)} />}</label>
  })}</div></div>)}</div>
}
function TrainingControls({ item, state, setState }: { item: Pretest } & Platform) {
  const [paused, setPaused] = useState(false)
  const status = state.pretestStatuses[item.id] || '未开始'
  function update(status: Status) { setState(previous => ({ ...previous, pretestStatuses: { ...previous.pretestStatuses, [item.id]: status } })) }
  return <div className="module-controls"><div><span>训练状态</span><strong>{paused && status === '进行中' ? '已暂停' : status}</strong></div><div className="control-buttons"><button className="button button-primary" onClick={() => { update('进行中'); setPaused(false) }}>开始训练</button><button className="button button-secondary" disabled={status !== '进行中' || paused} onClick={() => setPaused(true)}>暂停</button><button className="button button-secondary" disabled={status !== '进行中' || !paused} onClick={() => setPaused(false)}>继续</button><button className="button button-secondary" onClick={() => { update('未开始'); setPaused(false) }}>重置</button><button className="button button-quiet" disabled={status !== '进行中' || paused} onClick={() => update('已完成')}>完成训练</button></div></div>
}
function PretestPage(platform: Platform) {
  const { slug } = useParams()
  const item = pretests.find(test => test.slug === slug)
  const [selectedStrategy, setSelectedStrategy] = useState<Support>('N0')
  if (!item) return <Navigate to="/" replace />
  const strategy = supports.find(option => option.id === selectedStrategy)!
  return <main className="page module-page"><div className="module-header"><div><span className="section-number">PRE-EXPERIMENT / {item.id}</span><h1>{item.name}</h1><p>{item.purpose}</p></div><Link className="back-link" to="/">← 返回首页</Link></div>
    {item.slug === 'support' ? <>
      <section className="module-panel"><h2>N0–N4 策略选择</h2><div className="option-group support-group">{supports.map(option => <button key={option.id} className={'option' + (selectedStrategy === option.id ? ' selected' : '')} aria-pressed={selectedStrategy === option.id} onClick={() => setSelectedStrategy(option.id)}><span>{option.id}</span> {option.name}</button>)}</div></section>
      <section className="module-panel strategy-description"><span className="section-number">{strategy.id} / {strategy.mechanism}</span><h2>{strategy.name}</h2><p>{strategy.detail}</p></section>
      <Preview title="支持策略实验预览区" detail="当前阶段仅展示结构，后续接入真实支持逻辑。" />
    </> : <div className="module-workspace"><section className="module-panel parameter-panel"><h2>参数设置</h2><ParameterControls item={item} {...platform} /></section><div className={'preview-layout' + (item.slug === 'combined-task' ? ' combined' : '')}>{item.slug === 'combined-task' ? <><Preview title="主任务区" detail="持续动态目标跟踪区占位" /><Preview title="次任务区" detail="随机插入次任务区占位" /></> : <Preview title={item.slug === 'main-task' ? '主任务实验显示区' : '次任务预览区'} detail={item.slug === 'main-task' ? '后续用于放置 MOT 动态目标' : '后续用于呈现真实 UAV 次任务'} />}</div></div>}
    <TrainingControls item={item} {...platform} /><div className="module-bottom"><Link className="back-link" to="/">← 返回首页</Link></div>
  </main>
}
function FormalRunPage({ state, setState }: Platform) {
  const navigate = useNavigate()
  const session = state.activeFormal
  if (!session) return <main className="page module-page"><div className="module-header"><div><span className="section-number">FORMAL EXPERIMENT</span><h1>正式实验</h1><p>请先在首页填写被试编号并配置实验条件。</p></div><Link className="back-link" to="/">← 返回首页</Link></div></main>
  const support = supports.find(item => item.id === session.conditions.support)
  function update(status: RunStatus) { setState(previous => previous.activeFormal ? { ...previous, activeFormal: { ...previous.activeFormal, status } } : previous) }
  function finish() {
    if (!session || session.status !== '进行中' || !support) return
    const record: FormalRecord = {
      participantId: session.participantId, trialId: String(state.formalRecords.length + 1).padStart(3, '0'),
      intervention: session.conditions.intervention, modality: session.conditions.modality,
      support: support.id, supportName: support.name, completedAt: new Date().toISOString(),
      status: '已完成', mainTaskResult: '模拟值', subTaskResult: '模拟值', attentionReturnResult: '模拟值',
    }
    setState(previous => ({ ...previous, activeFormal: null, formalRecords: [...previous.formalRecords, record] }))
    navigate('/#results')
  }
  return <main className="page module-page"><div className="module-header"><div><span className="section-number">FORMAL EXPERIMENT / RUN</span><h1>正式实验运行页</h1><p>当前阶段为独立实验页面框架，未接入真实刺激与数据采集。</p></div><Link className="back-link" to="/">← 返回首页</Link></div>
    <div className="run-meta"><div><span>被试编号</span><strong>{session.participantId}</strong></div><div><span>当前实验条件</span><strong>{conditionText(session.conditions)}</strong></div><div><span>实验状态</span><strong>{session.status}</strong></div></div>
    <div className="formal-preview-layout"><Preview title="主任务区" detail="后续用于持续动态目标跟踪主任务" /><Preview title="次任务区" detail="后续用于 UAV 突发次任务" /></div>
    <div className="module-controls"><div><span>实验控制</span><strong>{session.status}</strong></div><div className="control-buttons"><button className="button button-primary" disabled={session.status !== '待开始'} onClick={() => update('进行中')}>开始</button><button className="button button-secondary" disabled={session.status !== '进行中'} onClick={() => update('已暂停')}>暂停</button><button className="button button-secondary" disabled={session.status !== '已暂停'} onClick={() => update('进行中')}>继续</button><button className="button button-secondary" onClick={() => update('待开始')}>重置</button><button className="button button-quiet" disabled={session.status !== '进行中'} onClick={finish}>完成模拟实验</button></div></div><div className="module-bottom"><Link className="back-link" to="/">← 返回首页</Link></div>
  </main>
}
function App() {
  const platform = usePlatform()
  return <Routes><Route path="/" element={<Home {...platform} />} /><Route path="/pretest/main-task" element={<MainTaskPretestPage {...platform} />} /><Route path="/pretest/sub-task" element={<SubTaskPretestPage {...platform} />} /><Route path="/pretest/:slug" element={<PretestPage {...platform} />} /><Route path="/formal/run" element={<FormalRunPage {...platform} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>)
