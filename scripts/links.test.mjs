import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { load } from 'cheerio'

test('original hero precedes the full festival announcement in every phase', async () => {
  for (let phase = 1; phase <= 3; phase++) {
    const $ = load(await readFile(`dist/ticket-phases/phase-${phase}.html`, 'utf8'))
    assert.equal($('.hero-encounter h1').text(), 'La montañatiene supropio sonido.')
    assert.equal($('.hero-encounter .ticket-panel').length, 0)
    assert.equal($('.hero-encounter').next().attr('id'), 'entradas')
    assert.ok($('#entradas h2').text().includes('COCOFUNKA'))
    assert.equal($('#entradas .ticket-comparison>div').length, 2)
    assert.equal($('#entradas #lineup').length, 1)
  }
})

test('link hub is canonical, indexable and contains all seven migrated destinations', async () => {
  const $ = load(await readFile('dist/links/index.html', 'utf8'))
  assert.equal($('main h1').length, 1)
  assert.equal($('link[rel=canonical]').attr('href'), 'https://santosrock.com/links/')
  assert.equal($('meta[name=robots][content=noindex]').length, 0)
  assert.equal($('.links-destinations a').length, 7)
  for (const href of ['https://wa.me/50686896331', 'https://latiqueteracr.com/producto/festival-santos-rock-2027/', 'https://whatsapp.com/channel/0029VbAgWqlBfxoB4DSLkl0N', '/', 'https://www.instagram.com/santosrockcr', 'https://www.tiktok.com/@santos.rock', 'https://www.facebook.com/santosrockfest']) assert.equal($(`.links-destinations a[href="${href}"]`).length, 1, href)
  for (const node of $('.links-destinations a[target=_blank]').toArray()) assert.ok($(node).attr('rel').includes('noopener'))
  assert.equal($('.links-festival').attr('href'), '/#entradas')
  assert.ok((await readFile('dist/sitemap.xml', 'utf8')).includes('https://santosrock.com/links/'))
  assert.ok((await readFile('dist/_redirects', 'utf8')).includes('/links /links/ 301'))
})
