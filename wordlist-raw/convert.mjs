import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Usage: node wordlist-raw/convert.mjs <input.txt> <output-id> <title> <description>
// Example: node wordlist-raw/convert.mjs wordlist-raw/year7sem2unit1.txt year7sem2unit1 "Year 7 Sem 2 Unit 1" "七年级第二学期 Unit 1"

const [,, inputFile, outputId, title, description] = process.argv

if (!inputFile || !outputId || !title || !description) {
  console.error('Usage: node wordlist-raw/convert.mjs <input.txt> <output-id> <title> <description>')
  process.exit(1)
}

const normalize = s => s.replace(/[''‚‛]/g, "'")

const txt = readFileSync(inputFile, 'utf8')
const words = []

for (const line of txt.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue

  // Format 1: **word** /phonetics/ pos. meaning  (pos with or without *asterisks*)
  // Handles: * **word** /p/ n. meaning  |  **word** /p/ *n.* meaning  |  - **word** /p/ *n.* meaning
  const m1 = trimmed.match(/^[*>\-]?\s*\*\*(.+?)\*\*\s+\/(.+?)\/\s+\*?(\S+\.)\*?\s+(.+)$/)
  if (m1) {
    const [, word, phonetics, pos, meaning] = m1
    words.push({ word: normalize(word.trim()), meaning: meaning.trim(), note: `${pos} /${phonetics}/` })
    continue
  }

  // Format 2: **word** *pos.* meaning  (no phonetics, pos wrapped in asterisks)
  // Handles: - **hotel** *n.* 宾馆
  const m2 = trimmed.match(/^[*>\-]?\s*\*\*(.+?)\*\*\s+\*(\S+\.)\*\s+(.+)$/)
  if (m2) {
    const [, word, pos, meaning] = m2
    words.push({ word: normalize(word.trim()), meaning: meaning.trim(), note: pos })
    continue
  }

  // Format 3: **word** meaning  (phrases/idioms — no phonetics, no pos)
  // Handles: * **last but not least** 最后但同样重要的  |  > **sink or swim** 自生自灭
  const m3 = trimmed.match(/^[*>\-]?\s*\*\*(.+?)\*\*\s+(.+)$/)
  if (m3) {
    const [, word, meaning] = m3
    words.push({ word: normalize(word.trim()), meaning: meaning.trim(), note: '' })
    continue
  }
}

const output = {
  meta: { title, description, total: words.length },
  words,
}

const outPath = join('public/wordlists', `${outputId}.json`)
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')
console.log(`✓ ${words.length} words → ${outPath}`)
