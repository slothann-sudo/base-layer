import { questionOptions, type Answer, type SubTaskQuestion } from './SubTaskQuestionBank'

export function CountdownTimer({ remaining, limit, active }: { remaining: number; limit: number; active: boolean }) {
  return <div className={'countdown' + (active && remaining <= 3 ? ' urgent' : '')}><span>剩余时间</span><strong>{remaining.toFixed(1)} <small>秒</small></strong><div className="timer-track"><i style={{ width: `${Math.max(0, Math.min(100, remaining / limit * 100))}%` }} /></div></div>
}

export function SubTaskTable({ question, keys, dimensions }: { question: SubTaskQuestion; keys: Answer[]; dimensions: number }) {
  const options = questionOptions(question)
  const rows: { label: string; value: (key: Answer) => string }[] = [
    { label: '任务阶段', value: key => options[key].taskStage },
    { label: '当前覆盖', value: key => `${options[key].currentCoverage}%` },
    { label: '未确认线索', value: key => String(options[key].unconfirmedClues) },
    { label: '高价值线索', value: key => String(options[key].highValueClues) },
    { label: '到达代价', value: key => options[key].arrivalCost },
  ]
  const shown = dimensions === 5 ? rows : dimensions === 4 ? rows.slice(0, 4) : [rows[0], rows[1], rows[3]]
  return <div className="sub-table-scroll"><table className="sub-task-table"><thead><tr><th scope="col">判断指标</th>{keys.map(key => <th scope="col" key={key}>{options[key].label}</th>)}</tr></thead><tbody>{shown.map(row => <tr key={row.label}><th scope="row">{row.label}</th>{keys.map(key => <td key={key}>{row.value(key)}</td>)}</tr>)}</tbody></table></div>
}

export function SubTaskOptionButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button type="button" className="button button-secondary sub-option-button" disabled={disabled} onClick={onClick}>{label}</button>
}

export function SubTaskCard({ question, keys, dimensions, remaining, limit, active, onAnswer }: { question: SubTaskQuestion; keys: Answer[]; dimensions: number; remaining: number; limit: number; active: boolean; onAnswer: (answer: Answer) => void }) {
  const options = questionOptions(question)
  return <section className="sub-task-card"><div className="sub-task-top"><div><span className="new-task-label">NEW TASK</span><h2>{question.title}</h2><p>{question.prompt.replace('三个', keys.length === 2 ? '两个' : '三个')}</p></div><CountdownTimer remaining={remaining} limit={limit} active={active} /></div><SubTaskTable question={question} keys={keys} dimensions={dimensions} /><div className="sub-task-options">{keys.map(key => <SubTaskOptionButton key={key} label={options[key].label} disabled={!active} onClick={() => onAnswer(key)} />)}</div></section>
}
