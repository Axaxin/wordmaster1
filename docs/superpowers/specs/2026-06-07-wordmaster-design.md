# WordMaster — Architecture Design

**Date:** 2026-06-07  
**Stack:** Cloudflare Pages + Pages Functions + D1  
**Deployment:** GitHub → Cloudflare Pages (manual connection in CF console, auto-deploy on push)

---

## 1. Overview

A web app for vocabulary drilling. Students select a word list (unit), then type English words from Chinese prompts until every word is answered correctly. Built entirely on Cloudflare's free tier.

---

## 2. Overall Architecture

```
GitHub repo
  └── push → Cloudflare Pages (auto build & deploy)
               ├── /public/wordlists/   ← JSON word list files (static assets)
               ├── /functions/api/      ← Pages Functions (auto-routed as /api/*)
               └── /src/               ← React + Vite frontend

Cloudflare D1 (SQLite)
  └── bound to Pages Functions as DB binding
```

- **Frontend:** React + Vite, built to static assets by CF Pages build pipeline
- **API:** Pages Functions under `/functions/api/`, automatically routed to `/api/*`
- **Data:** Single D1 database, event-log schema (see §4)
- **Word lists:** JSON files served as static assets from `public/wordlists/`, parsed client-side

---

## 3. Word List Format

Files live at `public/wordlists/<name>.json`. An `index.json` in the same directory lists all available word lists for the selection screen.

### `public/wordlists/index.json`
```json
[
  { "file": "unit1.json", "title": "Unit 1", "description": "第一单元基础词汇", "total": 30 },
  { "file": "unit2.json", "title": "Unit 2", "description": "第二单元进阶词汇", "total": 25 }
]
```

### `public/wordlists/unit1.json`
```json
{
  "meta": {
    "title": "Unit 1",
    "description": "第一单元基础词汇",
    "total": 3
  },
  "words": [
    {
      "word": "apple",
      "meaning": "苹果",
      "note": ""
    },
    {
      "word": "run out of",
      "meaning": "用完；耗尽",
      "note": "固定搭配，后接名词或动名词"
    },
    {
      "word": "by no means",
      "meaning": "决不；绝非",
      "note": ""
    }
  ]
}
```

### Word List Field Reference (for AI agent use)

| Field | Required | Description |
|-------|----------|-------------|
| `meta.title` | Yes | Display name shown in the word list selection screen |
| `meta.description` | Yes | One-line description of the word list content |
| `meta.total` | Yes | Total number of word entries (must match actual count) |
| `word` | Yes | English word or phrase the student must spell; preserve original casing |
| `meaning` | Yes | Chinese meaning shown as the quiz prompt; use `；` to separate multiple meanings |
| `note` | Yes | Supplementary note shown below the prompt; use empty string `""` if none — do not omit the field |

**Reserved future fields (do not populate yet):**
- `image`: image filename hint, e.g. `"apple.jpg"`
- `example`: English example sentence

---

## 4. Data Model (D1)

Single event-log table. All flexible or future data goes into the `meta` JSON column — the table structure itself never needs to change.

```sql
CREATE TABLE quiz_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  student    TEXT NOT NULL,
  event_type TEXT NOT NULL,
  unit       TEXT,
  word       TEXT,
  correct    INTEGER,   -- 1 or 0; NULL for non-word events
  meta       TEXT,      -- JSON blob for extra data
  ts         INTEGER NOT NULL  -- Unix timestamp (ms)
);

CREATE INDEX idx_student ON quiz_events(student);
CREATE INDEX idx_student_unit ON quiz_events(student, unit);
```

### Event Types

| `event_type` | Fired when | Key fields |
|---|---|---|
| `session_start` | Student begins a quiz | `unit`, `meta.mode`, `meta.total_words` |
| `word_attempt` | Student submits an answer | `unit`, `word`, `correct`, `meta.attempt_number` |
| `session_complete` | All words answered correctly | `unit`, `meta.rounds`, `meta.duration_ms` |

---

## 5. API Endpoints

All under `/api/`, implemented as Pages Functions, return JSON.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/login` | Accept `{ username }`, auto-create student if new, return student record |
| `GET` | `/api/wordlists` | Return `public/wordlists/index.json` contents |
| `POST` | `/api/session/start` | Record `session_start` event, return `session_id` |
| `POST` | `/api/session/word` | Record `word_attempt` event |
| `POST` | `/api/session/complete` | Record `session_complete` event |
| `GET` | `/api/student/:username/stats` | Aggregate student history: completed units, high-error words |

> `/api/wordlists` fetches `public/wordlists/index.json` via internal fetch; it does not read the filesystem directly.

---

## 6. Frontend Routes

```
/                  → Login page (enter username)
/home              → Word list selection (cards from index.json)
/quiz/:unit        → Quiz config page (mode selection — currently Mode B only)
/quiz/:unit/play   → Active quiz page
/result            → Session result (accuracy, rounds, duration)
/stats             → Student personal stats (history, high-error words)
```

---

## 7. Quiz Flow — Mode B (Queue Cycle)

The only mode implemented initially. Architecture leaves room for Mode A (repeat-until-N-correct) and Mode C (spaced repetition) via a `mode` parameter passed at session start.

```
Init: shuffle word list → load into queue

Loop:
  Show top-of-queue word's Chinese meaning + note
  Student types answer → submit
    ├── Correct (case-insensitive, trimmed)
    │     → remove from queue
    │     → POST /api/session/word { correct: 1 }
    └── Wrong
          → show correct answer for 1.5s
          → move word to end of queue
          → POST /api/session/word { correct: 0 }

Queue empty → POST /api/session/complete → navigate to /result
```

**Answer matching rules:**
- Case-insensitive (`Apple` = `apple`)
- Leading/trailing whitespace ignored
- Internal spacing must match exactly (phrases: `run out of`)

**UI details on the quiz page:**
- Pronunciation button: calls `window.speechSynthesis.speak()` with the `word` value
- Progress indicator: `剩余 N 词 / 第 R 轮`
- Wrong answer display: show correct word for 1.5s before advancing

---

## 8. Directory Structure

```
wordmaster1/
├── public/
│   └── wordlists/
│       ├── index.json        ← word list index (manually maintained)
│       ├── unit1.json
│       └── unit2.json
├── src/
│   ├── pages/                ← one file per route
│   ├── components/           ← shared UI components
│   └── main.tsx
├── functions/
│   └── api/                  ← Pages Functions (one file per endpoint group)
├── migrations/
│   └── 0001_init.sql         ← D1 schema (applied once manually in CF console)
├── docs/
│   └── superpowers/specs/    ← design documents
├── CLAUDE.md
├── package.json
└── vite.config.ts
```

---

## 9. Deployment Notes

1. Connect GitHub repo to Cloudflare Pages in CF console (one-time setup)
2. Build command: `npm run build` | Output directory: `dist`
3. Create D1 database in CF console → bind as `DB` in Pages project settings
4. Apply `migrations/0001_init.sql` once via CF console D1 SQL editor
5. Subsequent deploys: `git push` → CF Pages auto-builds and deploys

---

## 10. Future Extension Points

- **Quiz modes:** Mode A (repeat-N-correct) and Mode C (spaced repetition) plug in via the `mode` field; quiz engine is designed as a swappable state machine
- **Image hints:** add `image` field to word entries; quiz page conditionally renders image if present
- **Audio upgrade:** replace Web Speech API with external TTS API in the pronunciation button component only
- **Admin UI:** `src/pages/admin/` directory reserved; currently managed by editing files in the repo
- **Real auth:** `/api/login` currently username-only; upgrade path is adding password hash or OAuth without changing the event schema
