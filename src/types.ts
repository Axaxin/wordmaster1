export interface WordEntry {
  word: string
  meaning: string
  note: string
  unit?: string
  image?: string
  example?: string
  comparative?: string
  superlative?: string
}

export interface WordListMeta {
  title: string
  description: string
  total: number
}

export interface WordList {
  meta: WordListMeta
  words: WordEntry[]
}

export interface WordListIndex {
  file: string
  title: string
  description: string
  total: number
  hasComparatives?: boolean
  hasIrregVerbs?: boolean
}

export interface Student {
  username: string
  created_at: number
}

export interface SessionStartResponse {
  session_id: number
}

export interface SessionSummary {
  session_id: number
  unit: string
  started_at: number
  finished_at: number | null
  rounds: number | null
  duration_ms: number | null
}

export interface WordErrorStat {
  word: string
  unit: string
  total_attempts: number
  correct_count: number
}

export interface StudentStats {
  sessions: SessionSummary[]
  high_error_words: WordErrorStat[]
}
