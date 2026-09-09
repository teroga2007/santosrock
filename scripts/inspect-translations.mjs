import { readFile } from 'node:fs/promises'
import { postUnits, pageUnits } from './editorial-units.mjs'
const kind = process.argv[2] || 'pages'
const data = JSON.parse(await readFile(kind === 'posts' ? 'src/data/blog-posts.json' : 'src/data/site-pages.json', 'utf8'))
for (const item of data.filter(item => !process.argv[3] || process.argv[3].split(',').includes(item.id))) {
  console.log(`ID ${item.id} / ${item.slug}`)
  const units = kind === 'posts' ? postUnits(item) : pageUnits(item)
  units.forEach((text, index) => console.log(`${index}: ${text}`))
}
