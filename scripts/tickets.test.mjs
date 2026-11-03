import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { load } from 'cheerio'

const source = await readFile('src/site/tickets.ts', 'utf8')
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const moduleUrl = 'data:text/javascript;base64,' + Buffer.from(javascript).toString('base64')
const { ticketPhaseAt, PHASE_TWO_START, EVENT_DAY_START } = await import(moduleUrl)

test('prices change at Costa Rica midnight, including the full November 16', () => {
  for (const [date, expected] of [
    ['2026-11-02T12:00:00-06:00', 0],
    ['2026-11-16T23:59:59.999-06:00', 0],
    ['2026-11-17T00:00:00-06:00', 1],
    ['2027-01-15T23:59:59.999-06:00', 1],
    ['2027-01-16T00:00:00-06:00', 2],
  ]) assert.equal(ticketPhaseAt(Date.parse(date)), expected, date)
})

test('Netlify routes homepage requests to the matching static variant', async () => {
  const edgeSource = (await readFile('netlify/edge-functions/ticket-phase.ts', 'utf8')).replace('../../src/site/tickets.ts', moduleUrl)
  const edgeJs = ts.transpileModule(edgeSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  const { default: route, config } = await import('data:text/javascript;base64,' + Buffer.from(edgeJs).toString('base64'))
  const originalNow = Date.now
  try {
    for (const [index, now] of [PHASE_TWO_START - 1, PHASE_TWO_START, EVENT_DAY_START].entries()) {
      Date.now = () => now
      assert.equal(route(new Request('https://santosrock.com/?source=test')).pathname, `/ticket-phases/phase-${index + 1}.html`)
    }
    assert.equal(config.path, '/')
  } finally { Date.now = originalNow }
})

test('all three HTML variants include the correct active price, savings and SEO', async () => {
  const prices = ['₡10 000', '₡13 500', '₡16 000']
  for (const [index, price] of prices.entries()) {
    const $ = load(await readFile(`dist/ticket-phases/phase-${index + 1}.html`, 'utf8'))
    assert.equal($('.ticket-price strong').text(), price)
    assert.ok($('meta[name=description]').attr('content').includes(price))
    assert.ok($('meta[property="og:description"]').attr('content').includes(price))
    assert.equal($('link[rel=canonical]').attr('href'), 'https://santosrock.com/')
    assert.equal($('.ticket-saving').length, index === 2 ? 0 : 1)
    if (index < 2) assert.ok($('.ticket-saving').text().includes(index === 0 ? '₡6 000' : '₡2 500'))
    assert.equal($('.ticket-comparison s').length, index)
  }
})
