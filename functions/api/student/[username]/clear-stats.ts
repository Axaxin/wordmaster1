/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database
}

export const onRequestDelete: PagesFunction<Env> = async ({ params, env }) => {
  const username = Array.isArray(params.username) ? params.username[0] : params.username
  if (!username) {
    return Response.json({ error: 'username required' }, { status: 400 })
  }

  await env.DB.prepare('DELETE FROM quiz_events WHERE student = ?').bind(username).run()

  return Response.json({ ok: true })
}
