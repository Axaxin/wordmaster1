/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

interface WordBody {
  session_id: number
  student: string
  unit: string
  word: string
  correct: 0 | 1
  attempt_number: number
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: WordBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id, student, unit, word, correct, attempt_number } = body
  if (!session_id || !student || !unit || !word || correct === undefined || !attempt_number) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const meta = JSON.stringify({ session_id, attempt_number })
  await env.DB.prepare(
    'INSERT INTO quiz_events (student, event_type, unit, word, correct, meta, ts) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(student, 'word_attempt', unit, word, correct, meta, Date.now()).run()

  return Response.json({ ok: true })
}
