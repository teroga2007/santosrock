import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { load } from 'cheerio'
import { extractEditorial, plainText, sanitizeEditorial, spamPattern } from './blog-html.mjs'

const root = process.cwd()
const source = 'https://santosrock.com/wp-json/wp/v2/posts'
// Explicit editorial review. New IDs must be inspected before adding them.
const approved = new Set([2561, 2457, 2137, 2041, 2002, 1980, 1970, 1938, 1924, 1880, 1859, 1844, 1814, 265])
const cache = path.join(root, '.cache/blog-migration')
await mkdir(cache, { recursive: true })
const report = { source, fetchedAt: new Date().toISOString(), totalAvailable: 0, pages: 0, migrated: [], spamExcluded: [], manualReview: [], droppedEmbeds: [], assets: [] }
let originals = []
if (process.argv.includes('--cached')) {
  originals = JSON.parse(await readFile(path.join(cache, 'posts.json'), 'utf8'))
  Object.assign(report, JSON.parse(await readFile(path.join(cache, 'source.json'), 'utf8')))
} else {
  for (let page = 1; ; page++) {
    const response = await fetch(`${source}?per_page=100&_embed&page=${page}`, { signal: AbortSignal.timeout(60000) })
    if (!response.ok) throw new Error(`WordPress ${response.status}`)
    const pages = Number(response.headers.get('x-wp-totalpages'))
    report.totalAvailable = Number(response.headers.get('x-wp-total'))
    if (!pages || !report.totalAvailable) throw new Error('Missing WordPress pagination headers')
    originals.push(...await response.json())
    report.pages = page
    if (page >= pages) break
  }
  await writeFile(path.join(cache, 'posts.json'), JSON.stringify(originals))
  await writeFile(path.join(cache, 'source.json'), JSON.stringify({ fetchedAt: report.fetchedAt, totalAvailable: report.totalAvailable, pages: report.pages }))
}
if (originals.length !== report.totalAvailable || new Set(originals.map(p => p.id)).size !== originals.length) throw new Error('Incomplete or duplicate source inventory')

const mimeExtensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'video/mp4': '.mp4' }
async function download(url, slug, label, assetMap) {
  const remote = new URL(url, 'https://santosrock.com')
  if (remote.hostname !== 'santosrock.com' || !remote.pathname.startsWith('/wp-content/uploads/') || remote.protocol !== 'https:') throw new Error(`Review media host: ${url}`)
  if (assetMap.has(remote.href)) return assetMap.get(remote.href)
  const key = createHash('sha256').update(remote.href).digest('hex')
  let data, mime
  try {
    data = await readFile(path.join(cache, key))
    mime = await readFile(path.join(cache, `${key}.mime`), 'utf8')
  } catch {
    const response = await fetch(remote, { signal: AbortSignal.timeout(120000) })
    if (!response.ok) throw new Error(`Media ${response.status}: ${remote}`)
    mime = response.headers.get('content-type')?.split(';')[0]
    if (!mimeExtensions[mime]) throw new Error(`Unsupported media: ${mime} ${remote}`)
    data = Buffer.from(await response.arrayBuffer())
    await writeFile(path.join(cache, key), data)
    await writeFile(path.join(cache, `${key}.mime`), mime)
  }
  const filename = `${label}${mimeExtensions[mime]}`
  const local = `/images/blog/${slug}/${filename}`
  await mkdir(path.join(root, 'public/images/blog', slug), { recursive: true })
  await writeFile(path.join(root, 'public', local), data)
  assetMap.set(remote.href, local)
  report.assets.push({ source: remote.href, local, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') })
  return local
}

const posts = []
for (const post of originals) {
  const title = plainText(post.title.rendered)
  if (spamPattern.test(`${title} ${post.slug} ${post.excerpt.rendered} ${post.content.rendered}`)) { report.spamExcluded.push({ id: post.id, title, reason: 'Strong spam indicator' }); continue }
  if (!approved.has(post.id)) { report.manualReview.push({ id: post.id, title, reason: 'Unreviewed editorial content' }); continue }
  if (!/^[a-z0-9-]+$/.test(post.slug)) throw new Error(`Unsafe slug: ${post.id}`)
  const { content, droppedEmbeds } = extractEditorial(post)
  const $ = load(content, null, false)
  const assets = new Map()
  const featured = post._embedded?.['wp:featuredmedia']?.[0]?.source_url
  if (!featured) throw new Error(`Missing featured image: ${post.id}`)
  const thumbnail = await download(featured, post.slug, 'thumbnail', assets)
  let imageIndex = 0
  for (const image of $('img').toArray()) {
    const parentUrl = $(image).closest('a').attr('href')
    const original = parentUrl && /\/wp-content\/uploads\/.*\.(jpg|jpeg|png|webp|gif)$/i.test(parentUrl) ? parentUrl : $(image).attr('src')
    const local = await download(original, post.slug, `image-${String(++imageIndex).padStart(2, '0')}`, assets)
    $(image).attr({ src: local, loading: 'lazy', decoding: 'async' }).removeAttr('width height')
  }
  let videoIndex = 0
  for (const media of $('video,audio,source').toArray()) {
    if ($(media).attr('src')) $(media).attr('src', await download($(media).attr('src'), post.slug, `media-${++videoIndex}`, assets))
    if ($(media).attr('poster')) $(media).attr('poster', await download($(media).attr('poster'), post.slug, `poster-${videoIndex}`, assets))
  }
  for (const anchor of $('a[href]').toArray()) {
    const href = $(anchor).attr('href')
    const remote = new URL(href, post.link)
    if (assets.has(remote.href)) $(anchor).attr('href', assets.get(remote.href))
    else if (remote.hostname === 'santosrock.com' && /\/wp-content\/uploads\/.*\.(jpg|jpeg|png|webp|gif)$/i.test(remote.pathname)) $(anchor).attr('href', await download(remote.href, post.slug, `image-${String(++imageIndex).padStart(2, '0')}`, assets))
    else {
      const target = originals.find(candidate => candidate.link.replace(/\/$/, '') === remote.href.replace(/\/$/, '') && approved.has(candidate.id))
      if (target) $(anchor).attr('href', new URL(target.link).pathname)
    }
  }
  const categories = post._embedded['wp:term'].flat().filter(term => term.taxonomy === 'category').map(term => plainText(term.name))
  const migrated = { id: String(post.id), title, slug: post.slug, category: categories[0] || '', categories, thumbnail, excerpt: plainText(post.excerpt.rendered), content: sanitizeEditorial($.html()), date: post.date, sourceUrl: post.link }
  // Text equality includes captions and embed fallback copy; only layout whitespace may differ.
  const normalize = value => plainText(value).replace(/\s+/g, '')
  if (normalize(content) !== normalize(migrated.content)) throw new Error(`Editorial text changed: ${post.id}`)
  posts.push(migrated)
  report.migrated.push({ id: post.id, title, slug: post.slug, sourceContentSha256: createHash('sha256').update(post.content.rendered).digest('hex'), images: $('img').length, videos: $('video').length, embeds: $('iframe').length })
  report.droppedEmbeds.push(...droppedEmbeds.map(url => ({ id: post.id, url })))
  console.log(`Migrated ${post.id}: ${title} (${assets.size} assets)`)
}
await mkdir(path.join(root, 'src/data'), { recursive: true })
await mkdir(path.join(root, 'docs'), { recursive: true })
await writeFile(path.join(root, 'src/data/blog-posts.json'), JSON.stringify(posts, null, 2) + '\n')
await writeFile(path.join(root, 'docs/blog-migration-report.json'), JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ migrated: posts.length, spamExcluded: report.spamExcluded.length, manualReview: report.manualReview.length, assets: report.assets.length, pages: report.pages, totalAvailable: report.totalAvailable }))
