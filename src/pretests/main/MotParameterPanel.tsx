import type { MotParams } from './motEngine'

export function MotParameterPanel({ value, onChange, disabled }: { value: MotParams; onChange: (value: MotParams) => void; disabled: boolean }) {
  const number = (key: keyof MotParams, min: number, max: number, label: string, step = 1) => <label key={key}><span>{label}</span><input type="number" min={min} max={max} step={step} disabled={disabled} value={value[key]} onChange={event => onChange({ ...value, [key]: Number(event.target.value) })} /></label>
  const select = <K extends keyof MotParams>(key: K, label: string, choices: MotParams[K][]) => <label key={key}><span>{label}</span><select disabled={disabled} value={value[key]} onChange={event => onChange({ ...value, [key]: event.target.value })}>{choices.map(choice => <option key={String(choice)}>{choice}</option>)}</select></label>
  return <section className="module-panel pretest-parameters"><h2>参数设置</h2><div className="parameter-grid">
    {number('total', 2, 30, '动态目标总数')}{number('targets', 1, 12, '重点跟踪目标数量')}
    {number('highlightSeconds', 1, 30, '重点目标高亮时间（秒）', .5)}{number('trackingSeconds', 3, 180, '跟踪时间（秒）', .5)}
    {number('speed', 10, 300, '目标速度（px/s）')}{number('diameter', 12, 48, '目标直径（px）')}
    {select('area', '运动区域', ['自动适配', '紧凑区域'])}{select('movement', '目标运动方式', ['连续随机运动', '直线运动'])}
    {select('boundary', '边界规则', ['边界反弹', '边界环绕'])}{select('overlap', '目标重叠规则', ['避免完全重叠', '允许重叠'])}
    {number('seed', 0, 4294967295, '随机种子')}
  </div><p className="field-note">修改参数后开始下一轮。相同种子与参数可复现目标初始状态和运动轨迹。</p></section>
}
