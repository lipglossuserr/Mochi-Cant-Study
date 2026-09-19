/**
 * One glanceable completion pill, same visual language as
 * `components/tasks/PriorityBadge.tsx` (dot + label, rounded-full).
 * Renders nothing while a goal is still in progress — the progress bar
 * already communicates that; a badge only earns its place once a goal
 * is actually done. The backend exposes this as a plain `completed`
 * boolean, not a status enum, so this takes that directly.
 */
function GoalCompletionBadge({ completed }: { completed: boolean }) {
    if (!completed) return null

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-matcha-light px-2.5 py-1 font-body text-[11px] font-semibold text-ink">
      <span aria-hidden="true">✓</span>
      Completed
    </span>
    )
}

export default GoalCompletionBadge