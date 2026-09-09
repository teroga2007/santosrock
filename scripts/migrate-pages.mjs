import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { load } from 'cheerio'
import { sanitizeEditorial, plainText, spamPattern } from './blog-html.mjs'

const cache = '.cache/page-migration'
await mkdir(cache, { recursive: true })
const cached = process.argv.includes('--cached')
async function get(url, name) {
  const file = path.join(cache, name)
  if (cached) return readFile(file)
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) })
  if (!response.ok) throw new Error(`${response.status}: ${url}`)
  const data = Buffer.from(await response.arrayBuffer())
  await writeFile(file, data)
  return data
}
const pages = JSON.parse((await get('https://santosrock.com/wp-json/wp/v2/pages?per_page=100&_embed', 'pages.json')).toString())
if (pages.length >= 100) throw new Error('Review page pagination before importing')
const approved = new Set([285, 185, 198, 980, 208, 229, 2192, 3])
const report = { imported: [], assets: [], corrections: [
  'Visible telephone 8689-6331 retained; mismatched tel:50684157330 normalized to tel:+50686896331.',
  'Visible sponsor email info@santosrock.com retained; mismatched mailto:asocul.santosrock@gmail.com normalized to mailto:info@santosrock.com.',
], notes: ['Newsletter currently contains a poster and no subscription form in public WordPress.', 'Gallery and events currently contain construction notices.', 'Privacy policy copied as published; legacy references to WordPress accounts/comments remain editorial text.'] }
const assets = new Map()
async function media(url) {
  if (assets.has(url)) return assets.get(url)
  const remote = new URL(url)
  if (remote.origin !== 'https://santosrock.com' || !remote.pathname.startsWith('/wp-content/uploads/')) throw new Error(`Unreviewed image: ${url}`)
  const filename = path.basename(decodeURIComponent(remote.pathname))
  if (!/\.(png|jpg|jpeg|webp|svg)$/i.test(filename)) throw new Error(`Unsupported image: ${url}`)
  const data = await get(url, createHash('sha256').update(url).digest('hex'))
  if (/\.svg$/i.test(filename)) {
    const svg = load(data.toString(), { xmlMode: true })
    if (svg('script,foreignObject,iframe').length || /\bon[a-z]+\s*=|javascript:|@import|https?:|data:/i.test(svg('svg').html().replaceAll('http://www.w3.org/2000/svg', ''))) throw new Error(`SVG requires review: ${url}`)
  }
  const local = `/images/pages/${filename}`
  await mkdir('public/images/pages', { recursive: true })
  await writeFile(path.join('public', local), data)
  assets.set(url, local)
  report.assets.push({ source: url, local, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') })
  return local
}

const result = []
for (const page of pages.filter(page => approved.has(page.id))) {
  if (spamPattern.test(page.title.rendered + page.content.rendered)) throw new Error(`Spam indicator: ${page.slug}`)
  const rendered = (await get(page.link, `${page.slug}.html`)).toString()
  const full = load(rendered)
  const $ = load(page.content.rendered)
  const root = $('[data-elementor-type="wp-page"]').first()
  const sections = []
  for (const section of root.children('section').toArray()) {
    // The final footer is embedded in page content by Elementor; never migrate it.
    if ($(section).find('a[href*="templatekit.jegtheme.com"]').length || $(section).text().includes('ACCESO RÁPIDO')) continue
    const id = $(section).attr('data-id')
    const content = load($(section).html(), null, false)
    const maps = content('iframe').map((_, el) => ({ src: content(el).attr('src'), title: content(el).attr('title') })).get()
      .filter(frame => { const url = new URL(frame.src); return url.origin === 'https://maps.google.com' && url.pathname === '/maps' && url.searchParams.get('output') === 'embed' })
    const videoSettings = JSON.parse($(section).attr('data-settings') || '{}')
    const video = videoSettings.background_video_link || ''
    content('nav,footer,script,style,iframe,svg,form,input,button,[data-widget_type="countdown.default"],[data-widget_type="eael-countdown.default"],[data-widget_type="eael-post-grid.default"],[data-widget_type="spacer.default"],[data-widget_type="icon.default"]').remove()
    content('[data-widget_type]').each((_, el) => {
      if (/countdown|post-grid/.test(content(el).attr('data-widget_type'))) content(el).remove()
    })
    content('summary').each((_, el) => content(el).replaceWith(`<h3>${content(el).text().trim()}</h3>`))
    content('div,span').toArray().reverse().forEach(el => content(el).replaceWith(content(el).contents()))
    // The page-heading section repeats its breadcrumb label. Use the final heading once.
    if (sections.length === 0 && page.slug !== 'politica-privacidad' && page.slug !== 'inicio') {
      const headings = content('h1,h2,h3,h4,h5,h6')
      if (headings.length > 1) headings.slice(0, -1).remove()
    }
    for (const img of content('img').toArray()) {
      content(img).attr('src', await media(content(img).attr('src'))).attr({ loading: 'lazy', decoding: 'async' }).removeAttr('srcset sizes width height')
    }
    content('a[href]').each((_, el) => {
      const anchor = content(el)
      const href = anchor.attr('href')
      if (href.startsWith('tel:') && anchor.text().includes('8689')) anchor.attr('href', 'tel:+50686896331')
      else if (href.startsWith('mailto:') && anchor.text().includes('info@santosrock.com')) anchor.attr('href', 'mailto:info@santosrock.com')
      else if (href.startsWith('/') || href.startsWith('https://santosrock.com/')) {
        const url = new URL(href, 'https://santosrock.com')
        anchor.attr('href', url.pathname.replace(/\/?$/, '/') + url.search + url.hash)
      }
    })
    const backgrounds = []
    const ids = new Set([id, ...$(section).find('[data-id]').map((_, el) => $(el).attr('data-id')).get()])
    for (const rule of full('style').text().split('}')) {
      if (![...ids].some(id => rule.includes(`elementor-element-${id}`))) continue
      for (const match of rule.matchAll(/background-image:\s*url\(["']?(https:\/\/santosrock\.com\/wp-content\/uploads\/[^)'"\s]+)["']?\)/g)) {
        const local = await media(match[1])
        if (!backgrounds.includes(local)) backgrounds.push(local)
      }
    }
    const html = sanitizeEditorial(content.html()).trim()
    sections.push({ id, html, backgrounds, maps, video })
  }
  const title = plainText(page.title.rendered)
  const paragraph = sections.flatMap(section => { const $ = load(section.html); return $('p').map((_, el) => $(el).text().trim()).get() }).find(text => text.length > 80)
  const description = full('meta[name="description"]').attr('content') || paragraph || title
  result.push({ id: String(page.id), slug: page.slug, path: new URL(page.link).pathname, title, description, sections, modified: page.modified, sourceUrl: page.link })
  report.imported.push({ id: page.id, path: new URL(page.link).pathname, sections: sections.length, sha256: createHash('sha256').update(page.content.rendered).digest('hex') })
  console.log(`Migrated page: ${page.link}`)
}
await writeFile('src/data/site-pages.json', JSON.stringify(result, null, 2) + '\n')
await writeFile('docs/page-migration-report.json', JSON.stringify(report, null, 2) + '\n')
console.log(`${result.length} pages, ${assets.size} original assets`)
