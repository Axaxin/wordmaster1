# Tailwind UI Redesign Spec

## Goal

Replace all inline styles with Tailwind CSS v4, applying a clean light theme (white + indigo) across all pages.

## Setup

Install Tailwind CSS v4 via the official Vite plugin (`@tailwindcss/vite`). Add `@import "tailwindcss"` to `src/index.css`. No `tailwind.config.js` needed — v4 uses CSS-based config.

Remove placeholder styles from `src/App.css` and `src/index.css` (Vite scaffold artifacts).

## Visual Tokens

| Role | Class |
|---|---|
| Background | `bg-white` |
| Primary action | `bg-indigo-600 hover:bg-indigo-700` |
| Primary text | `text-gray-900` |
| Secondary text | `text-gray-500` |
| Border | `border-gray-200` |
| Card | `rounded-xl shadow-sm border border-gray-200` |
| Input focus | `focus:outline-none focus:ring-2 focus:ring-indigo-500` |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` |

## Page Designs

### LoginPage
Vertically centered card (`mt-[20vh]`), max-w-sm, shadow. Title "WordMaster" large bold. Subtitle gray. Input full-width with focus ring. Indigo submit button.

### HomePage
Top bar: "WordMaster" bold left, right side username + 统计 link + 退出 button. Word list as clickable cards with `hover:bg-gray-50 transition-colors`. Title bold, description gray-500, word count badge (gray-100 pill).

### QuizConfigPage
Back link top-left with ← arrow. Unit title + description. Single mode card with `border-2 border-indigo-600 bg-indigo-50` always-selected style (only one mode exists). Large indigo "开始测验" button.

### QuizPlayPage
Progress line: remaining count + round badge (`bg-indigo-100 text-indigo-700 rounded-full px-2`). WordCard (see below). Error feedback: red-50 bg + red-600 text alert box. Input large (text-lg), full width. Submit button indigo full width.

### ResultPage
Centered. ✅ emoji large. Stats in gray card (rounds, time). Three stacked buttons: re-try (indigo), other unit (outline), stats (ghost).

### StatsPage
Back link. Username heading. Session cards: unit bold left, date gray right, stats line below. Unfinished sessions show gray "未完成" badge. Error words table: alternating `even:bg-gray-50` rows, correct-rate colored red if < 50%, amber if 50–79%, green if ≥ 80%.

### WordCard
Meaning text `text-3xl font-bold text-gray-900 text-center`. Note `text-sm text-gray-500`. 🔊 replaced with indigo icon button: `rounded-full bg-indigo-100 hover:bg-indigo-200 p-2 text-indigo-700`.

## Constraints

- No component library — pure Tailwind only
- All inline `style={{...}}` props removed
- `src/App.css` cleared of scaffold styles (keep file, just empty or minimal reset)
- Tests must still pass after changes (logic untouched)
