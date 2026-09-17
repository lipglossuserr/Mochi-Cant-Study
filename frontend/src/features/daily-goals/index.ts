/**
 * Public surface of the daily-goals feature. Mirrors the barrel pattern
 * `features/tasks/index.ts` establishes — everything outside this
 * folder imports from here.
 */
export { useDailyGoals } from './hooks/useDailyGoals'
export { useDailyGoalMutations } from './hooks/useDailyGoalMutations'
export {
  fetchDailyGoals,
  createDailyGoal,
  updateDailyGoal,
  deleteDailyGoal,
} from './api/dailyGoalService'
export { getGoalProgress, formatGoalProgressLabel, getGoalTypeLabel } from './utils/formatGoalProgress'
export type { DailyGoal, GoalType, DailyGoalWriteRequest } from './types/dailyGoal'
