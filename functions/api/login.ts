/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { username?: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const username = body.username?.trim()
  if (!username || username.length > 50) {
    return Response.json({ error: 'username required (max 50 chars)' }, { status: 400 })
  }

  const now = Date.now()
  await env.DB.prepare(
    'INSERT OR IGNORE INTO students (username, created_at) VALUES (?, ?)'
  ).bind(username, now).run()

  const student = await env.DB.prepare(
    'SELECT username, created_at FROM students WHERE username = ?'
  ).bind(username).first<{ username: string; created_at: number }>()

  return Response.json(student)
}
