import { readFileSync, writeFileSync } from 'fs'
import { basename, join } from 'path'
import { fileURLToPath } from 'url'

// Usage: node wordlist-raw/convert.mjs <input.txt> <output-id> <title> <description>
// Example: node wordlist-raw/convert.mjs wordlist-raw/year7sem2unit1.txt year7sem2unit1 "Year 7 Sem 2 Unit 1" "七年级第二学期 Unit 1"

const [,, inputFile, outputId, title, description] = process.argv

if (!inputFile || !outputId || !title || !description) {
  console.error('Usage: node wordlist-raw/convert.mjs <input.txt> <output-id> <title> <description>')
  process.exit(1)
}

const txt = readFileSync(inputFile, 'utf8')
const words = []

for (const line of txt.split('\n')) {
  // Match: *   **word** /phonetics/ pos. meaning
  const m = line.match(/^\*\s+\*\*(.+?)\*\*\s+\/(.+?)\/\s+(\S+)\s+(.+)$/)
  if (!m) continue
  const [, word, phonetics, pos, meaning] = m
  words.push({
    word: word.trim(),
    meaning: meaning.trim(),
    note: `${pos} /${phonetics}/`,
  })
}

const output = {
  meta: { title, description, total: words.length },
  words,
}

const outPath = join('public/wordlists', `${outputId}.json`)
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n')
console.log(`✓ ${words.length} words → ${outPath}`)
