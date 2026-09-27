export type MotParams = {
  total: number; targets: number; highlightSeconds: number; trackingSeconds: number
  speed: number; diameter: number; area: '自动适配' | '紧凑区域'
  movement: '连续随机运动' | '直线运动'; boundary: '边界反弹' | '边界环绕'
  overlap: '避免完全重叠' | '允许重叠'; seed: number
}
export const defaultMotParams: MotParams = {
  total: 10, targets: 4, highlightSeconds: 5, trackingSeconds: 30,
  speed: 90, diameter: 24, area: '自动适配', movement: '连续随机运动',
  boundary: '边界反弹', overlap: '避免完全重叠', seed: Math.floor(Math.random() * 2_147_483_647),
}
export type MotTargetState = { id: number; x: number; y: number; vx: number; vy: number; isTarget: boolean }
export type MotEngine = { targets: MotTargetState[]; random: () => number; step: number }
export type MotScore = { correct: number; wrong: number; missed: number; total: number }

export function scoreMotSelection(targets: MotTargetState[], selected: number[]): MotScore {
  const focus = targets.filter(target => target.isTarget)
  const selectedIds = new Set(selected)
  const correct = focus.filter(target => selectedIds.has(target.id)).length
  return { correct, wrong: selectedIds.size - correct, missed: focus.length - correct, total: focus.length }
}

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6D2B79F5
    let next = value
    next = Math.imul(next ^ next >>> 15, next | 1)
    next ^= next + Math.imul(next ^ next >>> 7, next | 61)
    return ((next ^ next >>> 14) >>> 0) / 4294967296
  }
}
export function createMotEngine(params: MotParams, width: number, height: number): MotEngine {
  const random = seededRandom(params.seed)
  const radius = params.diameter / 2
  const targets: MotTargetState[] = []
  const ids = Array.from({ length: params.total }, (_, id) => id)
  for (let index = ids.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1)); [ids[index], ids[swap]] = [ids[swap], ids[index]]
  }
  const focus = new Set(ids.slice(0, params.targets))
  for (let id = 0; id < params.total; id++) {
    let x = radius, y = radius
    for (let attempt = 0; attempt < 100; attempt++) {
      x = radius + random() * Math.max(1, width - params.diameter)
      y = radius + random() * Math.max(1, height - params.diameter)
      if (targets.every(other => Math.hypot(other.x - x, other.y - y) > params.diameter * .9)) break
    }
    const angle = random() * Math.PI * 2
    targets.push({ id, x, y, vx: Math.cos(angle) * params.speed, vy: Math.sin(angle) * params.speed, isTarget: focus.has(id) })
  }
  return { targets, random, step: 0 }
}
export function advanceMot(engine: MotEngine, params: MotParams, width: number, height: number, dt: number) {
  const radius = params.diameter / 2
  engine.step++
  for (const target of engine.targets) {
    if (params.movement === '连续随机运动' && engine.step % 42 === 0) {
      const angle = Math.atan2(target.vy, target.vx) + (engine.random() - .5) * .75
      target.vx = Math.cos(angle) * params.speed; target.vy = Math.sin(angle) * params.speed
    }
    target.x += target.vx * dt; target.y += target.vy * dt
    if (params.boundary === '边界反弹') {
      if (target.x < radius || target.x > width - radius) { target.x = Math.max(radius, Math.min(width - radius, target.x)); target.vx *= -1 }
      if (target.y < radius || target.y > height - radius) { target.y = Math.max(radius, Math.min(height - radius, target.y)); target.vy *= -1 }
    } else {
      if (target.x < -radius) target.x = width + radius
      if (target.x > width + radius) target.x = -radius
      if (target.y < -radius) target.y = height + radius
      if (target.y > height + radius) target.y = -radius
    }
  }
  if (params.overlap === '避免完全重叠') {
    for (let i = 0; i < engine.targets.length; i++) for (let j = i + 1; j < engine.targets.length; j++) {
      const first = engine.targets[i], second = engine.targets[j]
      const dx = second.x - first.x, dy = second.y - first.y
      const distance = Math.hypot(dx, dy)
      if (distance > 0 && distance < params.diameter * .5) {
        const push = (params.diameter * .5 - distance) / 2
        first.x = Math.max(radius, Math.min(width - radius, first.x - dx / distance * push))
        first.y = Math.max(radius, Math.min(height - radius, first.y - dy / distance * push))
        second.x = Math.max(radius, Math.min(width - radius, second.x + dx / distance * push))
        second.y = Math.max(radius, Math.min(height - radius, second.y + dy / distance * push))
      }
    }
  }
}
