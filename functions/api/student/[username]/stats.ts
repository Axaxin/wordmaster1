/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async ({ params, env }) => {
  const username = Array.isArray(params.username) ? params.username[0] : params.username
  if (!username) {
    return Response.json({ error: 'username required' }, { status: 400 })
  }

  const starts = await env.DB.prepare(
    `SELECT id, unit, ts, meta FROM quiz_events
     WHERE student = ? AND event_type = 'session_start'
     ORDER BY ts DESC LIMIT 50`
  ).bind(username).all<{ id: number; unit: string; ts: number; meta: string }>()

  const completes = await env.DB.prepare(
    `SELECT meta, ts FROM quiz_events
     WHERE student = ? AND event_type = 'session_complete'`
  ).bind(username).all<{ meta: string; ts: number }>()

  const completeMap = new Map<number, { rounds: number; duration_ms: number; ts: number }>()
  for (const c of completes.results) {
    const m = JSON.parse(c.meta)
    completeMap.set(m.session_id, { rounds: m.rounds, duration_ms: m.duration_ms, ts: c.ts })
  }

  const sessions = starts.results.map(s => {
    const complete = completeMap.get(s.id)
    return {
      session_id: s.id,
      unit: s.unit,
      started_at: s.ts,
      finished_at: complete?.ts ?? null,
      rounds: complete?.rounds ?? null,
      duration_ms: complete?.duration_ms ?? null,
    }
  })

  const wordStats = await env.DB.prepare(
    `SELECT word, unit, COUNT(*) as total_attempts, SUM(correct) as correct_count
     FROM quiz_events
     WHERE student = ? AND event_type = 'word_attempt'
     GROUP BY word, unit
     HAVING correct_count < total_attempts
     ORDER BY (CAST(correct_count AS REAL) / total_attempts) ASC
     LIMIT 20`
  ).bind(username).all<{ word: string; unit: string; total_attempts: number; correct_count: number }>()

  return Response.json({
    sessions,
    high_error_words: wordStats.results,
  })
}
