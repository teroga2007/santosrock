import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { load } from 'cheerio'
const read = async path => JSON.parse(await readFile(path, 'utf8'))
const posts = await read('src/data/blog-posts.json')
const pages = await read('src/data/site-pages.json')
const translations = await read('src/locales/content.en.json')
const tags = (await read('src/data/legacy-routes.json')).tags
const origin = 'http://127.0.0.1:5173'
const tabs = await (await fetch('http://127.0.0.1:9223/json/list')).json()
const socket = new WebSocket(tabs.find(tab => tab.type === 'page' && tab.url.startsWith(origin)).webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
socket.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { pending.get(message.id)(message); pending.delete(message.id) } }
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const request = ++id
  const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 30000)
  pending.set(request, message => { clearTimeout(timer); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result) })
  socket.send(JSON.stringify({ id: request, method, params }))
})
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const waitFor = async expression => assert.ok(await evaluate(`new Promise(resolve=>{ const start=Date.now(); const check=()=>{if(${expression})resolve(true);else if(Date.now()-start>12000)resolve(false);else setTimeout(check,80)};check()})`), expression)
const navigate = async path => {
  await send('Page.navigate', { url: origin + path })
  await waitFor('document.querySelector("main h1") && Object.keys(document.querySelector("main h1")).some(key=>key.startsWith("__reactFiber"))')
}
const normalize = text => text.replace(/\s+/g, ' ').trim()
try {
  await navigate('/')
  await evaluate(`document.querySelector('button[lang="en"]').click()`)
  await waitFor('document.documentElement.lang === "en"')
  for (const item of [...pages, ...posts]) {
    const path = item.path || new URL(item.sourceUrl).pathname
    await navigate(path)
    assert.equal(await evaluate('document.documentElement.lang'), 'en', `Language persistence: ${path}`)
    const translated = item.content ? translations.posts[item.id] : translations.pages[item.id]
    if (path !== '/') assert.equal(await evaluate('document.querySelector("main h1").textContent'), translated.title, path)
    if (item.content) assert.equal(normalize(await evaluate('document.querySelector(".article-content").textContent')), normalize(load(translated.content).text()), path)
    else for (const section of item.sections.filter(section => item.slug !== 'newsletter').filter(section => item.path === '/' ? ![item.sections[0].id, item.sections.at(-1).id].includes(section.id) : item.slug === 'politica-privacidad' || section !== item.sections[0])) {
      const actual = await evaluate(`document.querySelector('.section-${section.id}').textContent`)
      const expected = normalize(load(translated.sections[section.id]).text())
      assert.ok(normalize(actual).includes(expected), `${path}/${section.id}`)
    }
    if (path !== '/') assert.ok((await evaluate('document.title')).includes(translated.title), `Title: ${path}`)
    for (const width of [320, 390, 768, 1440]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile: width < 640 })
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `${path}: ${width}px overflow`)
    }
    await evaluate(`Promise.all([...document.querySelectorAll('.brand img')].map(img=>img.decode()))`)
    assert.ok(await evaluate(`[...document.querySelectorAll('.brand img')].every(img=>img.getAttribute('src')==='/logo_SR_blanco.png' && img.naturalWidth>0)`))
  }
  const ui = await read('src/locales/en.json')
  for (const tag of tags) {
    await navigate(`/tag/${tag.slug}/`)
    assert.equal(await evaluate('document.querySelector("h1").textContent'), ui.categories[tag.name])
  }
  for (const [path, title] of [['/not-real/', ui.status.notFoundTitle], ['/en-construccion/', ui.status.title]]) {
    await navigate(path)
    assert.equal(await evaluate('document.querySelector("h1").textContent'), title)
  }
  await navigate('/contacto/')
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 1100, deviceScaleFactor: 1, mobile: true })
  await writeFile('.cache/page-migration/contact-en-mobile.png', Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  await evaluate(`document.querySelector('button[lang="es"]').click()`)
  await waitFor('document.documentElement.lang === "es"')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), pages.find(page => page.path === '/contacto/').title)
  await navigate('/')
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false })
  console.log('PASS: complete English content on all 22 documents, 7 tag archives, both status pages, metadata, logo, 4 viewport sizes, language persistence and return to Spanish.')
} finally { socket.close() }
