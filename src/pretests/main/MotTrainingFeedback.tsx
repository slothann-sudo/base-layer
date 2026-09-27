import type { MotScore } from './motEngine'

export function MotTrainingFeedback({ feedback }: { feedback: MotScore | null }) {
  if (!feedback) return null
  return <section className="module-panel training-feedback" aria-live="polite"><h2>训练反馈</h2><div className="feedback-stats"><div><span>正确识别</span><strong>{feedback.correct} / {feedback.total}</strong></div><div><span>错选</span><strong>{feedback.wrong}</strong></div><div><span>漏选</span><strong>{feedback.missed}</strong></div></div><p>这份反馈仅用于预实验训练。</p></section>
}
