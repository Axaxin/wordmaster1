import type {
  Student,
  WordListIndex,
  WordList,
  SessionStartResponse,
  StudentStats,
} from '../types'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`)
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

export const api = {
  login: (username: string) =>
    post<Student>('/api/login', { username }),

  getWordListIndex: () =>
    get<WordListIndex[]>('/wordlists/index.json'),

  getWordList: (file: string) =>
    get<WordList>(`/wordlists/${file}`),

  startSession: (params: { student: string; unit: string; mode: string; total_words: number }) =>
    post<SessionStartResponse>('/api/session/start', params),

  recordWord: (params: {
    session_id: number
    student: string
    unit: string
    word: string
    correct: 0 | 1
    attempt_number: number
  }) => post<{ ok: boolean }>('/api/session/word', params),

  completeSession: (params: {
    session_id: number
    student: string
    unit: string
    rounds: number
    duration_ms: number
  }) => post<{ ok: boolean }>('/api/session/complete', params),

  getStats: (username: string) =>
    get<StudentStats>(`/api/student/${encodeURIComponent(username)}/stats`),
}
