import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { load } from 'cheerio'
import { plainText, spamPattern } from './blog-html.mjs'

const pages = JSON.parse(await readFile('src/data/site-pages.json', 'utf8'))
const posts = JSON.parse(await readFile('src/data/blog-posts.json', 'utf8'))
const routes = JSON.parse(await readFile('docs/route-migration-report.json', 'utf8'))
const legacy = JSON.parse(await readFile('src/data/legacy-routes.json', 'utf8'))
const compact = text => text.replace(/\s+/g, '')

test('all 36 provided sitemap URLs are preserved with actual HTML or RSS', async () => {
  const source = load(await readFile('docs/legacy-sitemap.xml', 'utf8'), { xmlMode: true })
  const originalPaths = source('loc').map((_, el) => new URL(source(el).text()).pathname).get()
  assert.equal(originalPaths.length, 36)
  assert.deepEqual(routes.originalSitemapRoutes.map(item => item.path), originalPaths)
  for (const route of routes.originalSitemapRoutes) {
    const xml = route.kind === 'feed'
    const text = await readFile(`dist${route.path}index.${xml ? 'xml' : 'html'}`, 'utf8')
    const $ = load(text, xml ? { xmlMode: true } : {})
    if (xml) assert.equal($('rss channel').length, 1, route.path)
    else {
      assert.equal($('main h1').length, 1, route.path)
      assert.ok($('main').text().trim().length > 20, route.path)
      assert.equal(new URL($('link[rel="canonical"]').attr('href')).pathname, route.path)
      assert.equal($('meta[name="robots"][content="noindex"]').length, 0)
    }
  }
})

test('every original article uses its WordPress route and new aliases have permanent redirects', async () => {
  const apache = await readFile('dist/.htaccess', 'utf8')
  const portable = await readFile('dist/_redirects', 'utf8')
  for (const post of posts) {
    const route = new URL(post.sourceUrl).pathname
    const $ = load(await readFile(`dist${route}index.html`, 'utf8'))
    assert.equal($('main h1').text(), post.title)
    assert.equal(new URL($('link[rel=canonical]').attr('href')).pathname, route)
    assert.ok(portable.includes(`/blog/${post.slug}/ ${route} 301`))
    assert.ok(apache.includes(`RewriteRule ^blog/${post.slug}/$ ${route} [R=301,L,NE]`))
  }
  assert.ok(apache.includes('ErrorDocument 404 /404.html'))
  assert.ok(apache.includes('RewriteRule ^ - [R=404,L]'))
  assert.equal(portable.includes('/* /index.html 200'), false)
  assert.ok((await stat('dist/404.html')).size > 0)
})

test('original page copy and content images are present in prerendered React', async () => {
  for (const page of pages) {
    const $ = load(await readFile(`dist${page.path}index.html`, 'utf8'))
    const text = compact($('main').text())
    const sections = page.slug === 'politica-privacidad' ? page.sections : page.sections.slice(1)
    for (const section of sections.filter(section => page.slug !== 'newsletter' && section.id !== '54dbc2b8')) {
      assert.ok(text.includes(compact(plainText(section.html))), `${page.slug}/${section.id}: missing source text`)
      const source = load(section.html)
      for (const image of source('img').toArray()) {
        const local = source(image).attr('src')
        assert.ok($(`main img[src="${local}"]`).length, local)
      }
    }
    for (const image of $('main img').toArray()) {
      const local = $(image).attr('src')
      assert.ok(local.startsWith('/images/'), local)
      assert.ok((await stat(`public${local}`)).size > 0, local)
    }
    assert.equal(spamPattern.test($('main').text()), false)
    assert.equal($('main script,main [onclick],main [onerror]').length, 0)
  }
})

test('contact actions match published email and visible telephone', async () => {
  const $ = load(await readFile('dist/contacto/index.html', 'utf8'))
  assert.ok($('main a[href="mailto:info@santosrock.com"]').length)
  assert.ok($('main a[href="tel:+50686896331"]').length)
  assert.equal($('main form').length, 0)
  assert.equal($('main iframe').attr('src'), 'https://maps.google.com/maps?q=Parque%20ernesto%20zumbado&t=m&z=15&output=embed&iwloc=near')
})

test('tag archives and tag RSS contain exactly the source-associated articles', async () => {
  for (const tag of legacy.tags) {
    const $ = load(await readFile(`dist/tag/${tag.slug}/index.html`, 'utf8'))
    assert.equal($('.blog-card').length, tag.postIds.length)
    const feed = load(await readFile(`dist/tag/${tag.slug}/feed/index.xml`, 'utf8'), { xmlMode: true })
    assert.equal(feed('item').length, tag.postIds.length)
    const expected = posts.filter(post => tag.postIds.includes(post.id)).map(post => post.title)
    assert.deepEqual($('.blog-card h2').map((_, el) => $(el).text()).get(), expected)
  }
})

test('sitemap contains only canonical HTML routes and 404 is noindex', async () => {
  const $ = load(await readFile('dist/sitemap.xml', 'utf8'), { xmlMode: true })
  assert.equal($('url').length, 30)
  for (const loc of $('loc').toArray()) {
    const route = new URL($(loc).text()).pathname
    assert.ok(routes.canonicalHtmlRoutes.includes(route))
    assert.equal(route.startsWith('/blog/') && route !== '/blog/', false)
  }
  const errorPage = load(await readFile('dist/404.html', 'utf8'))
  assert.equal(errorPage('meta[name=robots]').attr('content'), 'noindex')
  assert.equal(errorPage('link[rel=canonical]').length, 0)
})
