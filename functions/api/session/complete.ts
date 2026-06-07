/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

interface CompleteBody {
  session_id: number
  student: string
  unit: string
  rounds: number
  duration_ms: number
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: CompleteBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { session_id, student, unit, rounds, duration_ms } = body
  if (!session_id || !student || !unit || rounds === undefined || duration_ms === undefined) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const meta = JSON.stringify({ session_id, rounds, duration_ms })
  await env.DB.prepare(
    'INSERT INTO quiz_events (student, event_type, unit, meta, ts) VALUES (?, ?, ?, ?, ?)'
  ).bind(student, 'session_complete', unit, meta, Date.now()).run()

  return Response.json({ ok: true })
}
