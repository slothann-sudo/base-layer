import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Platform, Status } from '../../main'
import { ExperimentControlBar } from '../shared/ExperimentControlBar'
import { SubTaskCard } from './SubTaskCard'
import { defaultSubTaskParams, SubTaskParameterPanel, type SubTaskParams } from './SubTaskParameterPanel'
import { pickQuestions, SubTaskQuestionBank, type Answer, type SubTaskQuestion } from './SubTaskQuestionBank'
import { SubTaskTrainingFeedback } from './SubTaskTrainingFeedback'

type Phase = 'idle' | 'active' | 'paused' | 'answered' | 'finished'
export function SubTaskPretestPage({ setState }: Platform) {
  const [params, setParams] = useState<SubTaskParams>({ ...defaultSubTaskParams })
  const [runParams, setRunParams] = useState<SubTaskParams>({ ...defaultSubTaskParams })
  const [phase, setPhase] = useState<Phase>('idle')
  const [questions, setQuestions] = useState<SubTaskQuestion[]>([])
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(defaultSubTaskParams.limit)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  const [error, setError] = useState('')
  const remainingRef = useRef(defaultSubTaskParams.limit)
  const question = questions[index] || SubTaskQuestionBank.find(item => item.difficulty === params.difficulty) || SubTaskQuestionBank[0]
  const shownParams = phase === 'idle' ? params : runParams
  const keys: Answer[] = shownParams.candidates === 3 ? ['A', 'B', 'C'] : (['A', 'B', 'C'] as Answer[]).filter(key => key === question.correctAnswer || key === ({ A: 'B', B: 'C', C: 'A' } as Record<Answer, Answer>)[question.correctAnswer])

  function setProgress(status: Status) {
    setState(previous => ({ ...previous, pretestStatuses: { ...previous.pretestStatuses, 'PT-02': status } }))
  }
  function start() {
    if (!Number.isFinite(params.limit) || params.limit < 2 || params.limit > 60 || !Number.isInteger(params.count) || params.count < 1 || params.count > 30 || !Number.isFinite(params.gap) || params.gap < 0 || params.gap > 30) { setError('请检查单题限时、训练题数和题目间隔。'); return }
    setError(''); setRunParams({ ...params }); setQuestions(pickQuestions(params.difficulty, params.count, params.order === '随机'))
    setIndex(0); remainingRef.current = params.limit; setRemaining(params.limit); setAnswer(null); setTimedOut(false); setPhase('active'); setProgress('进行中')
  }
  function reset() {
    if (phase === 'idle') { setError(''); return }
    start()
  }
  function finishQuestion(selected: Answer | null) {
    if (phase !== 'active') return
    setAnswer(selected); setTimedOut(selected === null)
    if (index === questions.length - 1) { setPhase('finished'); setProgress('已完成') }
    else setPhase('answered')
  }
  function next() {
    if (phase !== 'answered') return
    setIndex(previous => previous + 1); remainingRef.current = runParams.limit; setRemaining(runParams.limit)
    setAnswer(null); setTimedOut(false); setPhase('active')
  }
  useEffect(() => {
    if (phase !== 'active') return
    let frame = 0, last = 0
    const tick = (now: number) => {
      if (!last) last = now
      remainingRef.current = Math.max(0, remainingRef.current - Math.min((now - last) / 1000, .1)); last = now
      const display = Math.ceil(remainingRef.current * 10) / 10
      setRemaining(previous => previous === display ? previous : display)
      if (remainingRef.current <= 0) { finishQuestion(null); return }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [phase, index])
  useEffect(() => {
    if (phase !== 'answered' || !runParams.autoNext) return
    const timer = setTimeout(next, runParams.gap * 1000)
    return () => clearTimeout(timer)
  }, [phase, index, runParams.autoNext, runParams.gap])
  const status = phase === 'idle' ? '未开始' : phase === 'paused' ? '已暂停' : phase === 'finished' ? '已完成' : phase === 'answered' ? '等待下一题' : '进行中'
  return <main className="page module-page pretest-page"><div className="module-header"><div><span className="section-number">PRE-EXPERIMENT / PT-02</span><h1>次任务预实验</h1><p>UAV 任务冲突快速判读训练。比较候选方案，选出下一阶段最合适的任务。</p></div><Link className="back-link" to="/">← 返回首页</Link></div>
    <SubTaskParameterPanel value={params} onChange={setParams} disabled={phase !== 'idle' && phase !== 'finished'} />
    {error && <p className="validation" role="alert">{error}</p>}
    <div className="decision-rule"><strong>判读原则</strong><p>优先紧迫任务，关注覆盖不足区域；优先高价值和未确认线索，同等情况下选择到达代价更低的方案。</p></div>
    <div className="question-progress"><span>次任务卡片</span><strong>{phase === 'idle' ? '训练预览' : `第 ${index + 1} / ${questions.length} 题`}</strong><span>{question.taskId} · {question.difficulty}</span></div>
    <SubTaskCard question={question} keys={keys} dimensions={shownParams.dimensions} remaining={phase === 'idle' ? params.limit : remaining} limit={shownParams.limit} active={phase === 'active'} onAnswer={finishQuestion} />
    {(phase === 'answered' || phase === 'finished') && <SubTaskTrainingFeedback question={question} answer={answer} timedOut={timedOut} showDetails={runParams.feedback} />}
    <ExperimentControlBar status={status} controls={[
      { label: '开始训练', onClick: start, primary: true, disabled: phase !== 'idle' && phase !== 'finished' },
      { label: '暂停', onClick: () => setPhase('paused'), disabled: phase !== 'active' },
      { label: '继续', onClick: () => setPhase('active'), disabled: phase !== 'paused' },
      { label: '重置', onClick: reset, disabled: phase === 'idle' },
      { label: '下一题', onClick: next, disabled: phase !== 'answered' },
    ]} />
    <div className="module-bottom"><Link className="back-link" to="/">← 返回首页</Link></div>
  </main>
}
