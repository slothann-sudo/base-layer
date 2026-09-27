import type { MotTargetState } from './motEngine'

export type MotPhase = 'idle' | 'preparing' | 'highlight' | 'tracking' | 'selection' | 'feedback'

function MotTarget({ target, diameter, highlighted, selected, selectable, onClick }: { target: MotTargetState; diameter: number; highlighted: boolean; selected: boolean; selectable: boolean; onClick: () => void }) {
  return <button type="button" className={'mot-target' + (highlighted ? ' focus' : '') + (selected ? ' chosen' : '')} style={{ left: target.x, top: target.y, width: diameter, height: diameter }} aria-label={selectable ? `目标 ${target.id + 1}${selected ? '，已选择' : ''}` : '移动目标'} disabled={!selectable} onClick={onClick}>{selectable ? target.id + 1 : ''}</button>
}

export function MotTask({ areaRef, phase, targets, diameter, selected, maxSelect, remaining, paused, compact, onToggle }: { areaRef: React.RefObject<HTMLDivElement | null>; phase: MotPhase; targets: MotTargetState[]; diameter: number; selected: number[]; maxSelect: number; remaining: number; paused: boolean; compact: boolean; onToggle: (id: number) => void }) {
  const message = phase === 'idle' ? '设置参数后点击“开始训练”' : phase === 'preparing' ? '准备开始 · 请记住即将高亮的重点目标' : phase === 'highlight' ? '请记住高亮的重点目标' : phase === 'tracking' ? '持续跟踪最初的重点目标' : phase === 'selection' ? `请选择你认为最初被标记的 ${maxSelect} 个目标` : '本轮训练已提交'
  return <section className="mot-section"><div className="task-strip"><span>主任务显示区 / MOT</span><strong>{message}</strong><span>{['preparing', 'highlight', 'tracking'].includes(phase) ? `${remaining.toFixed(1)} 秒` : phase === 'selection' ? `已选择 ${selected.length} / ${maxSelect}` : '—'}</span></div><div className={'mot-area' + (compact ? ' compact' : '')} ref={areaRef}>
    {targets.map(target => <MotTarget key={target.id} target={target} diameter={diameter} highlighted={phase === 'highlight' && target.isTarget} selected={phase === 'selection' && selected.includes(target.id)} selectable={phase === 'selection'} onClick={() => onToggle(target.id)} />)}
    {(phase === 'idle' || phase === 'preparing') && <div className="mot-center"><span>{phase === 'preparing' ? remaining.toFixed(1) : '◎'}</span><strong>{message}</strong></div>}
    {paused && <div className="mot-pause">已暂停</div>}
  </div></section>
}
