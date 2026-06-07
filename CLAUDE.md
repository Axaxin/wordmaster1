# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Local development (full stack):**
```bash
npx wrangler pages dev -- npm run dev
```
Runs Vite (port 5173) proxied by Wrangler (port 8788). Always open `http://localhost:8788` in the browser — not 5173 — so API calls route through the Functions runtime.

**Run tests:**
```bash
npm run test:run
```

**Build:**
```bash
npm run build
```

**Apply D1 migration locally (run once after first clone):**
```bash
npx wrangler d1 execute wordmaster-db --local --file=migrations/0001_init.sql
```

## Architecture

Full design: `docs/superpowers/specs/2026-06-07-wordmaster-design.md`

- **Frontend:** `src/` — React + Vite. One file per route in `src/pages/`, shared UI in `src/components/`, quiz state machine in `src/hooks/useQuiz.ts`, API wrappers in `src/lib/api.ts`.
- **API:** `functions/api/` — Cloudflare Pages Functions, auto-routed to `/api/*`. Each file handles one endpoint. All functions receive D1 via `context.env.DB`. Use triple-slash `/// <reference types="@cloudflare/workers-types" />` at top of each function file.
- **Word lists:** `public/wordlists/` — static JSON assets served by Pages. `index.json` is the manifest; one `.json` file per unit. Fetched directly by the browser with no Worker involvement.
- **Database:** `wordmaster-db` D1 database. Schema in `migrations/0001_init.sql`. Two tables: `students` (login) and `quiz_events` (event log for all quiz activity).

## Deployment

1. Push to GitHub → CF Pages auto-builds (`npm run build`, output: `dist`)
2. D1 binding: create database in CF console → bind as `DB` in Pages project settings → update `database_id` in `wrangler.toml`
3. Apply `migrations/0001_init.sql` once via CF console D1 SQL editor

## Adding Word Lists

Add a new JSON file to `public/wordlists/` following the schema in `docs/superpowers/specs/2026-06-07-wordmaster-design.md` §3, then add an entry to `public/wordlists/index.json`. Push to GitHub — no build step required.
