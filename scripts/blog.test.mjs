import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access, stat } from 'node:fs/promises'
import path from 'node:path'
import { load } from 'cheerio'
import { extractEditorial, plainText, sanitizeEditorial, spamPattern, trustedEmbed } from './blog-html.mjs'

const posts = JSON.parse(await readFile('src/data/blog-posts.json', 'utf8'))
const report = JSON.parse(await readFile('docs/blog-migration-report.json', 'utf8'))

test('complete, unique, explicitly reviewed editorial inventory with no spam', () => {
  assert.equal(posts.length, 14)
  assert.equal(new Set(posts.map(p => p.slug)).size, posts.length)
  assert.equal(report.totalAvailable, posts.length + report.spamExcluded.length + report.manualReview.length)
  assert.equal(report.pages, 1)
  assert.equal(report.manualReview.length, 0)
  for (const post of posts) {
    for (const key of ['id', 'title', 'slug', 'category', 'thumbnail', 'excerpt', 'content', 'date', 'sourceUrl']) assert.ok(post[key], `${post.id}: ${key}`)
    assert.equal(spamPattern.test(`${post.title} ${post.excerpt} ${post.content}`), false, post.slug)
    assert.ok(post.categories.includes(post.category))
  }
})

test('all thumbnails, inline photos, gallery targets and videos are local existing assets', async () => {
  for (const post of posts) {
    const $ = load(post.content)
    const paths = [post.thumbnail, ...$('img,video,audio,source').map((_, el) => $(el).attr('src')).get(), ...$('a[href^="/images/blog/"]').map((_, el) => $(el).attr('href')).get()]
    for (const local of paths) {
      assert.ok(local.startsWith(`/images/blog/${post.slug}/`), local)
      const file = path.resolve('public', `.${local}`)
      assert.ok(file.startsWith(path.resolve('public/images/blog') + path.sep))
      assert.ok((await stat(file)).size > 0, local)
    }
    assert.equal($('nav,footer,script,style,form,svg').length, 0)
    assert.equal(/elementor|wp-image-|wp-content|\[titulo_entrada\]/i.test(post.content), false, post.slug)
    $('iframe').each((_, el) => assert.ok(trustedEmbed($(el).attr('src'))))
  }
})

test('sanitizer blocks active markup and only admits exact trusted embed paths', () => {
  const output = sanitizeEditorial('<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">unsafe</a><iframe src="https://evil.test/embed"></iframe><iframe src="https://open.spotify.com.evil.test/embed/track/a"></iframe><iframe src="https://open.spotify.com/not-an-embed"></iframe><iframe srcdoc="<script>alert(1)</script>" src="https://open.spotify.com/embed/track/abc"></iframe><svg onload="alert(1)"></svg><p style="background:url(javascript:alert(1))">safe <strong>bold</strong></p>')
  const $ = load(output)
  assert.equal($('script,svg').length, 0)
  assert.equal(/onerror|onload|javascript:|srcdoc|style=/.test(output), false)
  assert.equal($('iframe').length, 1)
  assert.equal($('iframe').attr('sandbox'), 'allow-scripts allow-same-origin allow-popups')
  assert.equal($('strong').text(), 'bold')
  for (const value of ['https://www.instagram.com.evil.test/p/x/embed/', 'http://www.instagram.com/p/x/embed/', 'https://www.instagram.com:8443/p/x/embed/', '//www.instagram.com/p/x/embed/']) assert.equal(trustedEmbed(value), false)
})

let originals
try { originals = JSON.parse(await readFile('.cache/blog-migration/posts.json', 'utf8')) } catch { /* Run migrate:blog to enable source comparison. */ }
// Approved copy edits, while retaining all original prose and structural checks.
const reviewedCopy = text => text.replace(/\bsantos\s+rock\b/gi, 'Santos Rock')
  .replaceAll('Zona de los Santos', 'Zona de Los Santos')
  .replaceAll('zona de los Santos', 'zona de Los Santos')
  .replaceAll('Instagram Oficial', 'Instagram oficial')
  .replaceAll('meseta central', 'Meseta Central')
test('original copy, heading hierarchy, paragraphs, captions, images and dates are preserved', { skip: !originals }, () => {
  const compact = html => reviewedCopy(plainText(html)).replace(/\s+/g, '')
  for (const post of posts) {
    const original = originals.find(item => String(item.id) === post.id)
    assert.ok(original)
    assert.equal(post.title, reviewedCopy(plainText(original.title.rendered)))
    assert.equal(post.excerpt, reviewedCopy(plainText(original.excerpt.rendered)))
    assert.equal(post.date, original.date)
    assert.equal(post.sourceUrl, original.link)
    const { content } = extractEditorial(original)
    assert.equal(compact(post.content), compact(content), post.slug)
    const source = load(original.content.rendered)
    const section = source('section[data-id="5aa35477"]')
    // Provider controls are not editorial copy; compare all actual article text.
    section.find('script,style,svg,[data-instgrm-permalink]').remove()
    const migrated = load(post.content)
    migrated('.article-embed').remove()
    assert.equal(compact(section.html()), compact(migrated.root().html()), `${post.slug}: source prose`)
    const headings = section.find('h1,h2,h3,h4,h5,h6').toArray().filter(el => !/^[A-ZÁÉÍÓÚÑ]$/.test(source(el).text().trim())).map(el => `${el.tagName}:${source(el).text()}`)
    assert.deepEqual(migrated('h1,h2,h3,h4,h5,h6').map((_, el) => `${el.tagName}:${migrated(el).text()}`).get(), headings.map(reviewedCopy), `${post.slug}: headings`)
    assert.equal(migrated('img').length, section.find('img').length, `${post.slug}: images`)
    const spacedSource = load(content)
    spacedSource('.article-embed').remove()
    assert.equal(migrated('p').length, spacedSource('p').length, `${post.slug}: paragraphs without WordPress spacers`)
    assert.deepEqual(migrated('figcaption,dd').map((_, el) => migrated(el).text()).get(), section.find('figcaption,dd').map((_, el) => source(el).text()).get(), `${post.slug}: captions`)
  }
})

test('all article routes have static original-content metadata after build', async () => {
  for (const post of posts) {
    const file = `dist${new URL(post.sourceUrl).pathname}index.html`
    await access(file)
    const $ = load(await readFile(file, 'utf8'))
    assert.equal($('title').text(), `${post.title} | Santos Rock`)
    assert.equal($('meta[name="description"]').attr('content'), post.excerpt)
    assert.equal($('meta[property="og:description"]').attr('content'), post.excerpt)
    assert.ok($('link[rel="canonical"]').attr('href').endsWith(new URL(post.sourceUrl).pathname))
    assert.ok($('meta[property="og:image"]').attr('content').endsWith(post.thumbnail))
  }
})
