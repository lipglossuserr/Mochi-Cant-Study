import type { DailyGoal, GoalType } from '../types/dailyGoal'

/**
 * Small, dependency-free progress math for a goal — same spirit as
 * `features/pet/utils/xp.ts`'s `getXpProgress`: never lets a component
 * compute a percentage inline, and clamps defensively in case a goal's
 * `current` ever exceeds its `target` (e.g. a linked study session
 * overshooting a "minutes" target).
 */
export function getGoalProgress(goal: Pick<DailyGoal, 'current' | 'target'>) {
  const target = Math.max(goal.target, 0)
  const current = Math.max(goal.current, 0)
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return { current, target, percent }
}

/**
 * There's no `unit` field on the backend, so this derives a display
 * unit purely from `type` for goals where one makes sense; CUSTOM goals
 * (free-form, user-defined) show a bare count.
 */
export function getGoalTypeUnitLabel(type: GoalType): string | null {
  switch (type) {
    case 'STUDY_MINUTES':
      return 'min'
    case 'TASKS_COMPLETED':
      return 'tasks'
    case 'CUSTOM':
    default:
      return null
  }
}

/** Friendly label for the type picker and for a goal card's subtitle. */
export function getGoalTypeLabel(type: GoalType): string {
  switch (type) {
    case 'STUDY_MINUTES':
      return 'Study minutes'
    case 'TASKS_COMPLETED':
      return 'Tasks completed'
    case 'CUSTOM':
    default:
      return 'Custom'
  }
}

/** e.g. "3 / 5 tasks" or "12 / 30" when the goal type has no natural unit. */
export function formatGoalProgressLabel(goal: Pick<DailyGoal, 'current' | 'target' | 'type'>): string {
  const { current, target } = getGoalProgress(goal)
  const unit = getGoalTypeUnitLabel(goal.type)
  return unit ? `${current} / ${target} ${unit}` : `${current} / ${target}`
}