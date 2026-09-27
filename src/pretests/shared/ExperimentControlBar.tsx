type Control = { label: string; onClick: () => void; disabled?: boolean; primary?: boolean }

export function ExperimentControlBar({ status, controls }: { status: string; controls: Control[] }) {
  return <div className="module-controls"><div><span>训练状态</span><strong>{status}</strong></div><div className="control-buttons">{controls.map(control => <button key={control.label} type="button" className={'button ' + (control.primary ? 'button-primary' : 'button-secondary')} disabled={control.disabled} onClick={control.onClick}>{control.label}</button>)}</div></div>
}
