// Demo data for preview mode (no backend required)

export const MOCK_SUMMARY = {
  monthly: [
    { month: '2026-01', income: 45000, expenses: 28000, burn_rate: -17000 },
    { month: '2026-02', income: 50000, expenses: 32000, burn_rate: -18000 },
    { month: '2026-03', income: 48000, expenses: 35000, burn_rate: -13000 },
    { month: '2026-04', income: 52000, expenses: 29000, burn_rate: -23000 },
    { month: '2026-05', income: 55000, expenses: 38000, burn_rate: -17000 },
  ],
  total_balance: 97000,
  total_income: 250000,
  total_expenses: 162000,
}

export const MOCK_TRANSACTIONS = {
  items: [
    { id: '1', amount: 5000, type: 'expense', date: '2026-05-20', description: 'Groceries', category_id: 'cat1' },
    { id: '2', amount: 55000, type: 'income', date: '2026-05-15', description: 'Salary', category_id: 'cat2' },
    { id: '3', amount: 1200, type: 'expense', date: '2026-05-14', description: 'Transport', category_id: 'cat3' },
    { id: '4', amount: 3500, type: 'expense', date: '2026-05-12', description: 'Dining', category_id: 'cat1' },
    { id: '5', amount: 800, type: 'expense', date: '2026-05-10', description: 'Coffee', category_id: 'cat1' },
  ],
  total: 5,
}

export const MOCK_CATEGORIES = [
  { id: 'cat1', user_id: 'u1', name: 'Food', color: '#F59E0B', budget_limit: 8000, created_at: '' },
  { id: 'cat2', user_id: 'u1', name: 'Income', color: '#22C55E', budget_limit: null, created_at: '' },
  { id: 'cat3', user_id: 'u1', name: 'Transport', color: '#3B82F6', budget_limit: 2000, created_at: '' },
]

export const MOCK_TASKS = [
  { id: 't1', title: 'Morning workout', state: 'completed', sort_order: 0, date: '2026-05-22', due_time: null },
  { id: 't2', title: 'Review pull requests', state: 'pending', sort_order: 1, date: '2026-05-22', due_time: null },
  { id: 't3', title: 'Write weekly report', state: 'pending', sort_order: 2, date: '2026-05-22', due_time: '2026-05-22T17:00:00Z' },
  { id: 't4', title: 'Call with client', state: 'delayed', sort_order: 3, date: '2026-05-22', due_time: null },
]

export const MOCK_HISTORY: Record<string, boolean> = {
  '2026-05-21': true,
  '2026-05-20': true,
  '2026-05-19': true,
  '2026-05-18': false,
  '2026-05-17': true,
  '2026-05-16': true,
  '2026-05-15': false,
  '2026-05-14': true,
  '2026-05-13': true,
}

export const MOCK_NOTES = [
  { id: 'n1', title: 'Project Ideas', body: '## Ideas\n\n- Build a CLI tool\n- Explore Rust\n- Write a blog post about FastAPI', tag_label: 'Work', tag_color: '#3B82F6', pinned: true, created_at: '', updated_at: '' },
  { id: 'n2', title: 'Reading List', body: '1. Clean Code\n2. The Pragmatic Programmer\n3. Designing Data-Intensive Applications', tag_label: 'Personal', tag_color: '#22C55E', pinned: false, created_at: '', updated_at: '' },
  { id: 'n3', title: 'Meeting Notes', body: 'Discussed Q3 roadmap. Key points:\n- Launch v2 by August\n- Hire 2 engineers', tag_label: 'Work', tag_color: '#3B82F6', pinned: false, created_at: '', updated_at: '' },
]

export const IS_PREVIEW = !import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL === 'https://your-api.onrender.com'
