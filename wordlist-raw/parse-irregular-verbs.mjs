import { readFileSync, writeFileSync } from 'fs'

const raw = readFileSync('wordlist-raw/Irregular Verbs.md', 'utf8')

// Extract data rows (lines like: | 1 | am / is | was /wɒz; wʌz/ |)
const rows = raw.split('\n')
  .filter(line => /^\|\s*\d+\s*\|/.test(line))
  .map(line => {
    const cols = line.split('|').map(s => s.trim()).filter(Boolean)
    // cols[0]=seq, cols[1]=base form, cols[2]=past tense
    const meaning = stripPhonetics(cols[1])
    const word = primaryForm(stripPhonetics(cols[2]))
    return { word, meaning, note: '过去式' }
  })

// Remove /.../  phonetic notation (must have a closing slash to avoid matching "am / is")
function stripPhonetics(s) {
  return s.replace(/\s*\/[^/]+\//g, '').trim()
}

// Take the first form when multiple are listed (e.g. "burnt, burned" → "burnt")
function primaryForm(s) {
  return s.split(',')[0].trim()
}

const parts = [
  {
    file: 'irregverbs-part1.json',
    title: '不规则动词 第一组',
    description: 'am/is → forget',
    slice: rows.slice(0, 35),
  },
  {
    file: 'irregverbs-part2.json',
    title: '不规则动词 第二组',
    description: 'freeze → rise',
    slice: rows.slice(35, 71),
  },
  {
    file: 'irregverbs-part3.json',
    title: '不规则动词 第三组',
    description: 'run → write',
    slice: rows.slice(71),
  },
]

for (const part of parts) {
  const output = {
    meta: { title: part.title, description: part.description, total: part.slice.length },
    words: part.slice,
  }
  writeFileSync(`public/wordlists/${part.file}`, JSON.stringify(output, null, 2) + '\n')
  console.log(`✓ ${part.slice.length} words → public/wordlists/${part.file}`)
}
