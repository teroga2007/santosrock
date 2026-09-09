import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { load } from 'cheerio'

test('subscription form is prerendered for Netlify detection with matching fields', async () => {
  const $ = load(await readFile('dist/newsletter/index.html', 'utf8'))
  const form = $('form[name="newsletter"][data-netlify="true"]')
  assert.equal(form.length, 1)
  assert.equal(form.attr('method'), 'POST')
  assert.equal(form.find('[name="form-name"]').val(), 'newsletter')
  assert.equal(form.find('input[type="email"][name="email"][required]').length, 1)
  assert.equal(form.find('[name="consent"][required]').length, 1)
  assert.equal(form.find('[name="bot-field"]').length, 1)
  assert.equal(form.find('[name="language"]').val(), 'es')
  assert.equal($('main img[src$="1000063474.jpg"]').length, 0)
})
test('home embeds the linked culture video and keeps video and date out of the hero', async () => {
  const $ = load(await readFile('dist/index.html', 'utf8'))
  assert.equal($('.original-hero iframe, .original-hero time').length, 0)
  assert.match($('.hero-motto').text(), /Por la libertad/)
  assert.equal($('.culture-section iframe').attr('src'), 'https://www.youtube-nocookie.com/embed/a2M5F3Dw3nM')
  assert.equal($('.culture-photo').length, 0)
  assert.equal($('.timer').length, 1)
})
