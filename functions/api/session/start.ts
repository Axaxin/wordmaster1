/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

interface StartBody {
  student: string
  unit: string
  mode: string
  total_words: number
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: StartBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { student, unit, mode, total_words } = body
  if (!student || !unit || !mode || total_words == null) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const meta = JSON.stringify({ mode, total_words })
  const result = await env.DB.prepare(
    'INSERT INTO quiz_events (student, event_type, unit, meta, ts) VALUES (?, ?, ?, ?, ?)'
  ).bind(student, 'session_start', unit, meta, Date.now()).run()

  return Response.json({ session_id: result.meta.last_row_id })
}
