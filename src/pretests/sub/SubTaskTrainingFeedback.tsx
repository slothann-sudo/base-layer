import { questionOptions, type Answer, type SubTaskQuestion } from './SubTaskQuestionBank'

export function SubTaskTrainingFeedback({ question, answer, timedOut, showDetails }: { question: SubTaskQuestion; answer: Answer | null; timedOut: boolean; showDetails: boolean }) {
  const options = questionOptions(question)
  return <section className="module-panel training-feedback" aria-live="polite"><h2>训练反馈</h2>{timedOut ? <p className="feedback-result">超时，本题推荐方案：<strong>{options[question.correctAnswer].label}</strong></p> : showDetails ? <><div className="feedback-stats"><div><span>你的选择</span><strong>{answer ? options[answer].label : '—'}</strong></div><div><span>正确答案</span><strong>{options[question.correctAnswer].label}</strong></div><div><span>判断</span><strong>{answer === question.correctAnswer ? '正确' : '错误'}</strong></div></div><p>{question.explanation}</p></> : <p className="feedback-result">已提交。点击“下一题”继续训练。</p>}<p className="feedback-note">反馈只用于预实验训练。</p></section>
}
