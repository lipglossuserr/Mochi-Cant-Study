import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DailyGoal, DailyGoalWriteRequest, GoalType } from '@/features/daily-goals'
import { getGoalTypeLabel } from '@/features/daily-goals'

interface GoalFormModalProps {
  mode: 'create' | 'edit'
  goal?: DailyGoal | null
  submitting: boolean
  error: string | null
  onSubmit: (payload: DailyGoalWriteRequest) => Promise<boolean>
  onClose: () => void
}

const GOAL_TYPES: GoalType[] = ['STUDY_MINUTES', 'TASKS_COMPLETED', 'CUSTOM']

/**
 * Shared Create/Edit form — same modal shell, input styling, and
 * validate-then-submit structure as `components/tasks/TaskFormModal.tsx`
 * (backdrop-blur overlay + scale-in card, `rounded-2xl border
 * border-white/60 bg-white/70 …` fields).
 *
 * Fields mirror the backend's real DTOs (see
 * `CreateDailyGoalRequest`/`UpdateDailyGoalRequest` on the backend):
 * `type`, `title`, `target` — nothing else. There is no
 * `description`/`unit` field on the backend, so this form doesn't
 * collect them. `type` is only shown in create mode, since the
 * backend's update endpoint doesn't accept changing it; edit mode
 * carries the goal's existing type through unchanged.
 *
 * Deliberately has no field for `current`/`completed` — those are
 * server-derived, so a person only ever sets what a goal *is*, never
 * its progress.
 */
function GoalFormModal({ mode, goal, submitting, error, onSubmit, onClose }: GoalFormModalProps) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [target, setTarget] = useState(goal ? String(goal.target) : '')
  const [type, setType] = useState<GoalType>(goal?.type ?? 'CUSTOM')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setValidationError('Give your goal a title first ♡')
      return
    }
    const parsedTarget = Number(target)
    if (!target || !Number.isInteger(parsedTarget) || parsedTarget <= 0) {
      setValidationError('Set a whole-number target greater than zero')
      return
    }
    setValidationError(null)

    const ok = await onSubmit({
      type,
      title: trimmedTitle,
      target: parsedTarget,
    })
    if (ok) onClose()
  }

  return (
      <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 py-10 backdrop-blur-sm"
            onClick={onClose}
        >
          <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-cream p-8 shadow-2xl"
          >
            <h3 className="font-display text-lg font-semibold text-ink">
              {mode === 'create' ? 'New daily goal' : 'Edit goal'}
            </h3>

            {(validationError || error) && (
                <p className="mt-3 rounded-2xl bg-blush/20 px-4 py-2 text-center font-body text-sm text-berry">
                  {validationError ?? error}
                </p>
            )}

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {mode === 'create' && (
                  <div>
                    <label htmlFor="goal-type" className="font-body text-xs font-semibold text-ink/60">
                      Goal type
                    </label>
                    <select
                        id="goal-type"
                        value={type}
                        onChange={(event) => setType(event.target.value as GoalType)}
                        disabled={submitting}
                        className="mt-1.5 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-taro disabled:opacity-60"
                    >
                      {GOAL_TYPES.map((option) => (
                          <option key={option} value={option}>
                            {getGoalTypeLabel(option)}
                          </option>
                      ))}
                    </select>
                  </div>
              )}

              <div>
                <label htmlFor="goal-title" className="font-body text-xs font-semibold text-ink/60">
                  Title
                </label>
                <input
                    id="goal-title"
                    type="text"
                    placeholder="What are you working toward today?"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={submitting}
                    autoFocus
                    className="mt-1.5 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 font-body text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-taro disabled:opacity-60"
                />
              </div>

              <div>
                <label htmlFor="goal-target" className="font-body text-xs font-semibold text-ink/60">
                  Target
                </label>
                <input
                    id="goal-target"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 3"
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    disabled={submitting}
                    className="mt-1.5 w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 font-body text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-taro disabled:opacity-60"
                />
              </div>

              <div className="mt-2 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="rounded-full bg-white px-6 py-2.5 font-body text-sm font-semibold text-ink/70 shadow hover:bg-blush-light disabled:opacity-60"
                >
                  Cancel
                </button>
                <motion.button
                    type="submit"
                    whileHover={{ scale: submitting ? 1 : 1.02 }}
                    whileTap={{ scale: submitting ? 1 : 0.97 }}
                    disabled={submitting}
                    className="rounded-full bg-taro px-6 py-2.5 font-body text-sm font-semibold text-white shadow-lg shadow-taro/30 transition-colors hover:bg-taro-dark disabled:opacity-60"
                >
                  {submitting
                      ? mode === 'create'
                          ? 'Creating…'
                          : 'Saving…'
                      : mode === 'create'
                          ? 'Create goal'
                          : 'Save changes'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </AnimatePresence>
  )
}

export default GoalFormModal