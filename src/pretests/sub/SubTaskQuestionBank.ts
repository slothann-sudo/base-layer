export type Answer = 'A' | 'B' | 'C'
export type Difficulty = '简单' | '中等' | '困难'
export type TaskOption = { label: string; taskStage: '紧急' | '近期' | '后续'; currentCoverage: number; unconfirmedClues: number; highValueClues: number; arrivalCost: '低' | '中' | '高' }
export type SubTaskQuestion = {
  taskId: string; uavId: string; title: string; prompt: string; difficulty: Difficulty; timeLimit: number
  optionA: TaskOption; optionB: TaskOption; optionC: TaskOption; correctAnswer: Answer; explanation: string
}
const option = (label: string, taskStage: TaskOption['taskStage'], currentCoverage: number, unconfirmedClues: number, highValueClues: number, arrivalCost: TaskOption['arrivalCost']): TaskOption => ({ label, taskStage, currentCoverage, unconfirmedClues, highValueClues, arrivalCost })
const labels = ['保持B区', '转派C区', '转派D区'] as const
const o = (index: 0 | 1 | 2, stage: TaskOption['taskStage'], coverage: number, clues: number, high: number, cost: TaskOption['arrivalCost']) => option(labels[index], stage, coverage, clues, high, cost)
function question(id: number, uav: string, difficulty: Difficulty, options: [TaskOption, TaskOption, TaskOption], correctAnswer: Answer, explanation: string): SubTaskQuestion {
  return { taskId: `ST-${String(id).padStart(2, '0')}`, uavId: uav, title: `${uav} 任务冲突待裁决`, prompt: `请比较三个候选方案并选择 ${uav} 下一阶段任务`, difficulty, timeLimit: 8, optionA: options[0], optionB: options[1], optionC: options[2], correctAnswer, explanation }
}
export const SubTaskQuestionBank: SubTaskQuestion[] = [
  question(1, 'UAV-01', '简单', [o(0,'紧急',15,3,1,'低'),o(1,'近期',40,1,0,'中'),o(2,'后续',55,0,0,'高')], 'A', 'B区任务最紧迫，覆盖也最低。'),
  question(2, 'UAV-02', '简单', [o(0,'后续',55,1,0,'低'),o(1,'紧急',18,3,1,'中'),o(2,'近期',35,2,0,'中')], 'B', 'C区任务紧急，覆盖不足且有高价值线索。'),
  question(3, 'UAV-03', '简单', [o(0,'后续',45,0,0,'低'),o(1,'近期',38,1,0,'中'),o(2,'紧急',12,4,1,'高')], 'C', 'D区任务紧急，需优先裁决。'),
  question(4, 'UAV-02', '中等', [o(0,'近期',20,3,1,'中'),o(1,'近期',48,2,1,'低'),o(2,'后续',18,3,1,'低')], 'A', '同为近期任务时，B区覆盖更低、线索更多。'),
  question(5, 'UAV-04', '中等', [o(0,'后续',15,4,1,'低'),o(1,'近期',25,2,1,'中'),o(2,'近期',50,1,0,'低')], 'B', 'C区较紧迫，覆盖较低且有高价值线索。'),
  question(6, 'UAV-05', '中等', [o(0,'近期',45,2,1,'低'),o(1,'后续',20,3,1,'低'),o(2,'近期',24,3,1,'中')], 'C', 'D区与B区同为近期，但覆盖更低、线索更多。'),
  question(7, 'UAV-06', '中等', [o(0,'紧急',28,2,1,'中'),o(1,'紧急',42,3,1,'低'),o(2,'近期',15,4,1,'低')], 'A', '紧急方案优先；B区覆盖低于C区。'),
  question(8, 'UAV-07', '中等', [o(0,'近期',30,2,0,'低'),o(1,'近期',26,2,1,'中'),o(2,'后续',18,3,1,'低')], 'B', 'C区覆盖稍低，并有高价值线索。'),
  question(9, 'UAV-08', '中等', [o(0,'近期',35,3,0,'低'),o(1,'近期',38,2,0,'低'),o(2,'近期',22,3,1,'中')], 'C', 'D区覆盖不足且有高价值线索。'),
  question(10, 'UAV-09', '困难', [o(0,'近期',24,3,1,'低'),o(1,'近期',25,3,1,'中'),o(2,'近期',27,2,1,'低')], 'A', '任务价值接近，B区覆盖稍低且代价低。'),
  question(11, 'UAV-10', '困难', [o(0,'近期',31,3,1,'高'),o(1,'近期',29,3,1,'低'),o(2,'近期',30,2,1,'低')], 'B', 'C区覆盖略低、线索相当且到达代价低。'),
  question(12, 'UAV-11', '困难', [o(0,'紧急',34,2,1,'中'),o(1,'紧急',33,2,1,'高'),o(2,'紧急',31,2,1,'低')], 'C', 'D区覆盖最低，且到达代价也最低。'),
]

export function questionOptions(question: SubTaskQuestion) { return { A: question.optionA, B: question.optionB, C: question.optionC } }

export function pickQuestions(difficulty: Difficulty, count: number, randomOrder: boolean): SubTaskQuestion[] {
  const pool = SubTaskQuestionBank.filter(item => item.difficulty === difficulty)
  const result: SubTaskQuestion[] = []
  while (result.length < count) {
    const batch = [...pool]
    if (randomOrder) for (let index = batch.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1)); [batch[index], batch[swap]] = [batch[swap], batch[index]]
    }
    result.push(...batch)
  }
  return result.slice(0, count)
}
