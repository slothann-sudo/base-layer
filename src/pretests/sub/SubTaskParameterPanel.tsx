import type { Difficulty } from './SubTaskQuestionBank'

export type SubTaskParams = { candidates: 2 | 3; dimensions: 3 | 4 | 5; limit: number; count: number; difficulty: Difficulty; order: '随机' | '固定'; feedback: boolean; autoNext: boolean; gap: number }
export const defaultSubTaskParams: SubTaskParams = { candidates: 3, dimensions: 5, limit: 8, count: 5, difficulty: '中等', order: '随机', feedback: true, autoNext: false, gap: 2 }

export function SubTaskParameterPanel({ value, onChange, disabled }: { value: SubTaskParams; onChange: (value: SubTaskParams) => void; disabled: boolean }) {
  const set = <K extends keyof SubTaskParams>(key: K, next: SubTaskParams[K]) => onChange({ ...value, [key]: next })
  return <section className="module-panel pretest-parameters"><h2>参数设置</h2><div className="parameter-grid">
    <label><span>候选方案数量</span><select disabled={disabled} value={value.candidates} onChange={event => set('candidates', Number(event.target.value) as 2 | 3)}><option value="3">3</option><option value="2">2</option></select></label>
    <label><span>指标维度数量</span><select disabled={disabled} value={value.dimensions} onChange={event => set('dimensions', Number(event.target.value) as 3 | 4 | 5)}><option value="5">5</option><option value="4">4</option><option value="3">3</option></select></label>
    <label><span>单题限时（秒）</span><input type="number" min="2" max="60" step=".5" disabled={disabled} value={value.limit} onChange={event => set('limit', Number(event.target.value))} /></label>
    <label><span>训练题数</span><input type="number" min="1" max="30" disabled={disabled} value={value.count} onChange={event => set('count', Number(event.target.value))} /></label>
    <label><span>默认难度</span><select disabled={disabled} value={value.difficulty} onChange={event => set('difficulty', event.target.value as Difficulty)}><option>简单</option><option>中等</option><option>困难</option></select></label>
    <label><span>题目顺序</span><select disabled={disabled} value={value.order} onChange={event => set('order', event.target.value as '随机' | '固定')}><option>随机</option><option>固定</option></select></label>
    <label><span>提交后反馈</span><select disabled={disabled} value={value.feedback ? '开启' : '关闭'} onChange={event => set('feedback', event.target.value === '开启')}><option>开启</option><option>关闭</option></select></label>
    <label><span>自动进入下一题</span><select disabled={disabled} value={value.autoNext ? '开启' : '关闭'} onChange={event => set('autoNext', event.target.value === '开启')}><option>关闭</option><option>开启</option></select></label>
    <label><span>题目之间间隔（秒）</span><input type="number" min="0" max="30" step=".5" disabled={disabled} value={value.gap} onChange={event => set('gap', Number(event.target.value))} /></label>
  </div></section>
}
