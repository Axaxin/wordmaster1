import { readFileSync, writeFileSync } from 'fs'

const src = JSON.parse(readFileSync('public/wordlists/year7sem2foundation-comparison.json', 'utf8'))
const words = src.words

const moreOverrides = {
  difficult:  { comparative: 'more difficult',  superlative: 'most difficult' },
  important:  { comparative: 'more important',  superlative: 'most important' },
  beautiful:  { comparative: 'more beautiful',  superlative: 'most beautiful' },
  dangerous:  { comparative: 'more dangerous',  superlative: 'most dangerous' },
}

function parseField(note, label) {
  const m = note.match(new RegExp(label + '\\s+([^；\\s]+)'))
  return m ? m[1].replace(/；.*/, '') : null
}

function annotate(w) {
  if (moreOverrides[w.word]) return { ...w, ...moreOverrides[w.word] }
  const comparative = parseField(w.note, '比较级')
  const superlative = parseField(w.note, '最高级')
  const entry = { ...w }
  if (comparative) entry.comparative = comparative
  if (superlative) entry.superlative = superlative
  return entry
}

const annotated = words.map(annotate)

const parts = [
  {
    file: 'year7sem2fc-part1.json',
    title: 'Year 7 Sem 2 FC 第一组',
    description: '形体描述 — 大小/尺寸/重量/速度/温度',
    slice: annotated.slice(0, 34),
  },
  {
    file: 'year7sem2fc-part2.json',
    title: 'Year 7 Sem 2 FC 第二组',
    description: '品质评价 — 整洁/难度/好坏/美丑/情绪',
    slice: annotated.slice(34, 68),
  },
  {
    file: 'year7sem2fc-part3.json',
    title: 'Year 7 Sem 2 FC 第三组',
    description: '状态与动作 — 情绪/状态/频率/天气/动词',
    slice: annotated.slice(68),
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
