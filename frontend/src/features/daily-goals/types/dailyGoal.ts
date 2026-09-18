/**
 * Mirrors the backend's actual Daily Goals contract — see
 * `dailygoal/dto/CreateDailyGoalRequest.java`, `UpdateDailyGoalRequest.java`,
 * and `DailyGoalResponse.java` in the backend repo. There is no
 * `description` or `unit` field anywhere on the backend; a goal is only
 * ever a `type` + `title` + `target`, tracked by server-derived `current`.
 */
export type GoalType = 'STUDY_MINUTES' | 'TASKS_COMPLETED' | 'CUSTOM'

export interface DailyGoal {
  id: number
  /** The calendar day (yyyy-MM-dd) this goal instance belongs to. */
  goalDate: string
  type: GoalType
  title: string
  /** Server-maintained progress toward target. Never written to by this frontend. */
  current: number
  /** The amount that counts as "done" for this goal. */
  target: number
  completed: boolean
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Request body for `POST /api/daily-goals` and `PUT /api/daily-goals/{id}`.
 * `type` is only settable on create — the backend's update DTO doesn't
 * accept it, so GoalFormModal never shows the picker in edit mode and
 * just carries the goal's existing type through unchanged.
 */
export interface DailyGoalWriteRequest {
  type: GoalType
  title: string
  target: number
}
