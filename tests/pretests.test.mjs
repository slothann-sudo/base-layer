import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceMot, createMotEngine, defaultMotParams, scoreMotSelection } from '../src/pretests/main/motEngine.ts'
import { SubTaskQuestionBank, pickQuestions } from '../src/pretests/sub/SubTaskQuestionBank.ts'

test('same MOT seed and parameters reproduce targets and trajectories', () => {
  const params = { ...defaultMotParams, seed: 12345 }
  const first = createMotEngine(params, 800, 480)
  const second = createMotEngine(params, 800, 480)
  assert.deepEqual(first.targets, second.targets)
  assert.equal(first.targets.filter(target => target.isTarget).length, params.targets)
  for (let frame = 0; frame < 600; frame++) {
    advanceMot(first, params, 800, 480, 1 / 60)
    advanceMot(second, params, 800, 480, 1 / 60)
  }
  assert.deepEqual(first.targets, second.targets)
  assert.ok(first.targets.every(target => target.x >= params.diameter / 2 && target.x <= 800 - params.diameter / 2 && target.y >= params.diameter / 2 && target.y <= 480 - params.diameter / 2))
  const focus = first.targets.filter(target => target.isTarget)
  const distractor = first.targets.find(target => !target.isTarget)
  assert.deepEqual(scoreMotSelection(first.targets, [focus[0].id, focus[1].id, distractor.id]), { correct: 2, wrong: 1, missed: 2, total: 4 })
})

test('question bank covers all difficulties and balances answer positions', () => {
  assert.ok(SubTaskQuestionBank.length >= 10)
  for (const difficulty of ['简单', '中等', '困难']) assert.ok(SubTaskQuestionBank.some(item => item.difficulty === difficulty))
  const counts = { A: 0, B: 0, C: 0 }
  for (const question of SubTaskQuestionBank) counts[question.correctAnswer]++
  assert.deepEqual(counts, { A: 4, B: 4, C: 4 })
  assert.equal(pickQuestions('中等', 5, false).length, 5)
})
