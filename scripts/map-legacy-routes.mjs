import { readFile, writeFile } from 'node:fs/promises'
import { load } from 'cheerio'

const sitemap = load(await readFile('docs/legacy-sitemap.xml', 'utf8'), { xmlMode: true })
const posts = JSON.parse(await readFile('src/data/blog-posts.json', 'utf8'))
const originals = JSON.parse(await readFile('.cache/blog-migration/posts.json', 'utf8'))
const pages = JSON.parse(await readFile('src/data/site-pages.json', 'utf8'))
const tags = new Map()
for (const post of originals) for (const tag of post._embedded['wp:term'].flat().filter(term => term.taxonomy === 'post_tag')) {
  if (!tags.has(tag.slug)) tags.set(tag.slug, { slug: tag.slug, name: tag.name, postIds: [] })
  tags.get(tag.slug).postIds.push(String(post.id))
}
const urls = sitemap('loc').map((_, el) => sitemap(el).text()).get()
const inventory = urls.map(value => {
  const url = new URL(value)
  if (url.origin !== 'https://santosrock.com') throw new Error(`Unexpected sitemap host: ${value}`)
  const route = url.pathname
  const post = posts.find(post => new URL(post.sourceUrl).pathname === route)
  const page = pages.find(page => page.path === route)
  const tag = tags.get(route.match(/^\/tag\/([^/]+)\/$/)?.[1])
  const kind = route.endsWith('/feed/') ? 'feed' : post ? 'post' : page ? 'page' : tag ? 'tag' : route === '/blog/' ? 'blog' : 'unresolved'
  if (kind === 'unresolved') throw new Error(`Unresolved legacy route: ${route}`)
  return { path: route, kind, status: 200 }
})
const redirects = posts.flatMap(post => [{ from: `/blog/${post.slug}`, to: new URL(post.sourceUrl).pathname }, { from: `/blog/${post.slug}/`, to: new URL(post.sourceUrl).pathname }])
redirects.push({ from: '/inicio', to: '/' }, { from: '/inicio/', to: '/' })
await writeFile('src/data/legacy-routes.json', JSON.stringify({ inventory, tags: [...tags.values()], redirects }, null, 2) + '\n')
// Existing migrated article-to-article links follow their original public paths too.
for (const post of posts) for (const target of posts) post.content = post.content.replaceAll(`href="/blog/${target.slug}"`, `href="${new URL(target.sourceUrl).pathname}"`)
await writeFile('src/data/blog-posts.json', JSON.stringify(posts, null, 2) + '\n')
console.log(`${inventory.length} sitemap routes mapped, ${tags.size} tag archives, ${redirects.length} compatibility redirects.`)
