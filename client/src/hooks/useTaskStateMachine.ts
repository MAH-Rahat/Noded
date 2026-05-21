type TaskState = 'pending' | 'completed' | 'delayed'

const transitions: Record<TaskState, TaskState[]> = {
  pending:   ['completed', 'delayed'],
  completed: ['pending'],
  delayed:   ['pending', 'completed'],
}

export function useTaskStateMachine() {
  function canTransition(from: TaskState, to: TaskState): boolean {
    return transitions[from]?.includes(to) ?? false
  }

  function toggle(current: TaskState): TaskState {
    if (current === 'completed') return 'pending'
    return 'completed'
  }

  return { canTransition, toggle, transitions }
}
