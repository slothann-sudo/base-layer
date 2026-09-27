import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Platform, Status } from '../../main'
import { ExperimentControlBar } from '../shared/ExperimentControlBar'
import { advanceMot, createMotEngine, defaultMotParams, scoreMotSelection, type MotEngine, type MotParams, type MotScore, type MotTargetState } from './motEngine'
import { MotParameterPanel } from './MotParameterPanel'
import { MotTask, type MotPhase } from './MotTask'
import { MotTrainingFeedback } from './MotTrainingFeedback'

export function MainTaskPretestPage({ setState }: Platform) {
  const [params, setParams] = useState<MotParams>(() => ({ ...defaultMotParams }))
  const [phase, setPhase] = useState<MotPhase>('idle')
  const [paused, setPaused] = useState(false)
  const [targets, setTargets] = useState<MotTargetState[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [feedback, setFeedback] = useState<MotScore | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [error, setError] = useState('')
  const areaRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<MotEngine | null>(null)
  const runParamsRef = useRef<MotParams>(params)
  const stageElapsedRef = useRef(0)
  const accumulatorRef = useRef(0)

  function setProgress(status: Status) {
    setState(previous => ({ ...previous, pretestStatuses: { ...previous.pretestStatuses, 'PT-01': status } }))
  }
  function start() {
    if (!Number.isFinite(params.total) || params.total < 2 || params.total > 30 || !Number.isInteger(params.total) || !Number.isInteger(params.targets) || params.targets < 1 || params.targets > params.total || params.targets > 12 || !Number.isFinite(params.highlightSeconds) || params.highlightSeconds < 1 || !Number.isFinite(params.trackingSeconds) || params.trackingSeconds < 3 || !Number.isFinite(params.speed) || params.speed < 10 || !Number.isFinite(params.diameter) || params.diameter < 12 || !Number.isInteger(params.seed) || params.seed < 0) {
      setError('请检查参数：目标数为 2–30，重点目标不超过总数，时间、速度、直径和种子需为有效数值。'); return
    }
    setError(''); runParamsRef.current = { ...params }; engineRef.current = null
    stageElapsedRef.current = 0; accumulatorRef.current = 0
    setTargets([]); setSelected([]); setFeedback(null); setRemaining(5); setPaused(false); setPhase('preparing')
    setProgress('进行中')
  }
  function reset() {
    start()
  }
  function submit() {
    if (phase !== 'selection' || !engineRef.current) return
    setFeedback(scoreMotSelection(engineRef.current.targets, selected))
    setPhase('feedback'); setProgress('已完成')
  }
  useEffect(() => {
    if (paused || !['preparing', 'highlight', 'tracking'].includes(phase)) return
    let frame = 0, last = 0, transitioning = false
    const duration = phase === 'preparing' ? 5 : phase === 'highlight' ? runParamsRef.current.highlightSeconds : runParamsRef.current.trackingSeconds
    const tick = (now: number) => {
      if (!last) last = now
      const dt = Math.min((now - last) / 1000, .05); last = now
      stageElapsedRef.current += dt
      if (phase === 'tracking' && engineRef.current && areaRef.current) {
        accumulatorRef.current += dt
        const width = areaRef.current.clientWidth, height = areaRef.current.clientHeight
        while (accumulatorRef.current >= 1 / 60) {
          advanceMot(engineRef.current, runParamsRef.current, width, height, 1 / 60)
          accumulatorRef.current -= 1 / 60
        }
        setTargets(engineRef.current.targets.map(target => ({ ...target })))
      }
      setRemaining(Math.max(0, duration - stageElapsedRef.current))
      if (stageElapsedRef.current >= duration && !transitioning) {
        transitioning = true; stageElapsedRef.current = 0; accumulatorRef.current = 0
        if (phase === 'preparing') {
          const width = areaRef.current?.clientWidth || 700, height = areaRef.current?.clientHeight || 420
          engineRef.current = createMotEngine(runParamsRef.current, width, height)
          setTargets(engineRef.current.targets.map(target => ({ ...target })))
          setRemaining(runParamsRef.current.highlightSeconds); setPhase('highlight')
        } else if (phase === 'highlight') { setRemaining(runParamsRef.current.trackingSeconds); setPhase('tracking') }
        else { setRemaining(0); setPhase('selection') }
        return
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, paused])
  const active = ['preparing', 'highlight', 'tracking'].includes(phase)
  const status = paused ? '已暂停' : phase === 'idle' ? '未开始' : phase === 'feedback' ? '已完成' : phase === 'selection' ? '等待提交' : '进行中'
  return <main className="page module-page pretest-page"><div className="module-header"><div><span className="section-number">PRE-EXPERIMENT / PT-01</span><h1>主任务预实验</h1><p>持续动态目标跟踪训练。记住初始高亮的目标，在它们移动后找出原来的重点目标。</p></div><Link className="back-link" to="/">← 返回首页</Link></div>
    <MotParameterPanel value={params} onChange={setParams} disabled={phase !== 'idle' && phase !== 'feedback'} />
    {error && <p className="validation" role="alert">{error}</p>}
    <MotTask areaRef={areaRef} phase={phase} targets={targets} diameter={runParamsRef.current.diameter} selected={selected} maxSelect={runParamsRef.current.targets} remaining={remaining} paused={paused} compact={(phase === 'idle' ? params.area : runParamsRef.current.area) === '紧凑区域'} onToggle={id => setSelected(previous => previous.includes(id) ? previous.filter(value => value !== id) : previous.length < runParamsRef.current.targets ? [...previous, id] : previous)} />
    {phase === 'selection' && <div className="mot-submit"><p>已选 {selected.length} / {runParamsRef.current.targets}。可以少选，漏选会计入反馈。</p><button className="button button-primary" onClick={submit}>提交选择</button></div>}
    <ExperimentControlBar status={status} controls={[
      { label: '开始训练', onClick: start, primary: true, disabled: phase !== 'idle' },
      { label: '暂停', onClick: () => setPaused(true), disabled: !active || paused },
      { label: '继续', onClick: () => setPaused(false), disabled: !active || !paused },
      { label: '重置', onClick: reset, disabled: phase === 'idle' },
      { label: '下一轮', onClick: start, disabled: phase !== 'feedback' },
    ]} />
    <MotTrainingFeedback feedback={feedback} /><div className="module-bottom"><Link className="back-link" to="/">← 返回首页</Link></div>
  </main>
}
