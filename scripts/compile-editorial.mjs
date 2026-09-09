import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { textNodes, postUnits, pageUnits } from './editorial-units.mjs'

const read = async path => JSON.parse(await readFile(path, 'utf8'))
const posts = await read('src/data/blog-posts.json')
const pages = await read('src/data/site-pages.json')
const postTranslations = { ...await read('src/locales/posts.en.json'), ...await read('src/locales/history.en.json') }
const pageTranslations = await read('src/locales/pages.en.json')
const content = { posts: {}, pages: {} }
function translate(item, units, translations, kind) {
  assert.equal(translations?.length, units.length, `${kind} ${item.id}: incomplete translation`)
  assert.ok(translations.every(value => typeof value === 'string' && value.trim()), `${kind} ${item.id}: empty translation`)
  let index = 2
  const html = source => {
    const { $, nodes } = textNodes(source)
    for (const node of nodes) {
      const leading = node.data.match(/^\s*/)[0]
      const trailing = node.data.match(/\s*$/)[0]
      node.data = leading + translations[index++] + trailing
    }
    return $.html()
  }
  return kind === 'post' ? { title: translations[0], excerpt: translations[1], content: html(item.content) } : {
    title: translations[0], description: translations[1],
    sections: Object.fromEntries(item.sections.map(section => [section.id, html(section.html)])),
  }
}
for (const post of posts) content.posts[post.id] = translate(post, postUnits(post), postTranslations[post.id], 'post')
for (const page of pages) content.pages[page.id] = translate(page, pageUnits(page), pageTranslations[page.id], 'page')
await writeFile('src/locales/content.en.json', JSON.stringify(content, null, 2) + '\n')
console.log(`Compiled complete English translations: ${posts.length} articles, ${pages.length} pages.`)
