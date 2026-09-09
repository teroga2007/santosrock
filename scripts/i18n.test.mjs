import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { load } from 'cheerio'
const read = async path => JSON.parse(await readFile(path, 'utf8'))
const content = await read('src/locales/content.en.json')
const posts = await read('src/data/blog-posts.json')
const pages = await read('src/data/site-pages.json')
function structure(html) {
  const $ = load(html, null, false)
  return $('*').map((_, node) => ({ tag: node.tagName, attributes: node.attribs })).get()
}
test('English covers every article and preserves markup, media and destinations', () => {
  assert.equal(Object.keys(content.posts).length, posts.length)
  for (const post of posts) {
    const en = content.posts[post.id]
    assert.ok(en.title && en.excerpt && en.content)
    assert.notEqual(en.content, post.content)
    assert.deepEqual(structure(en.content), structure(post.content), post.id)
  }
})
test('English covers all page sections without changing links or images', () => {
  assert.equal(Object.keys(content.pages).length, pages.length)
  for (const page of pages) {
    const en = content.pages[page.id]
    assert.ok(en.title && en.description)
    for (const section of page.sections) assert.deepEqual(structure(en.sections[section.id]), structure(section.html), `${page.id}/${section.id}`)
  }
})
test('UI dictionaries have the same complete key structure', async () => {
  const keys = (obj, prefix = '') => Object.entries(obj).flatMap(([key, value]) => typeof value === 'object' ? keys(value, `${prefix}${key}.`) : `${prefix}${key}`).sort()
  assert.deepEqual(keys(await read('src/locales/en.json')), keys(await read('src/locales/es.json')))
})
