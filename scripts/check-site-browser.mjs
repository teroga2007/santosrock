import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
const origin = 'http://127.0.0.1:5173'
const report = JSON.parse(await readFile('docs/route-migration-report.json', 'utf8'))

for (const route of report.originalSitemapRoutes) {
  const response = await fetch(origin + route.path, { redirect: 'manual' })
  assert.equal(response.status, 200, route.path)
  if (route.kind === 'feed') assert.ok(response.headers.get('content-type').includes('xml'), route.path)
  else assert.ok((await response.text()).includes('<h1'), route.path)
}
for (const redirect of report.redirects) {
  const response = await fetch(origin + redirect.from, { redirect: 'manual' })
  assert.equal(response.status, 301, redirect.from)
  assert.equal(response.headers.get('location'), redirect.to)
}
assert.equal((await fetch(origin + '/not-a-real-page/', { redirect: 'manual' })).status, 404)
console.log(`HTTP: all 36 sitemap routes are 200; ${report.redirects.length} redirects are 301; unknown pages are 404.`)

const tabs = await (await fetch('http://127.0.0.1:9223/json/list')).json()
const socket = new WebSocket(tabs.find(tab => tab.type === 'page' && tab.url.startsWith(origin)).webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
socket.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { pending.get(message.id)(message); pending.delete(message.id) } }
const send = (method, params = {}) => new Promise((resolve, reject) => { const request = ++id; const timer = setTimeout(() => reject(new Error(`Timeout: ${method}`)), 30000); pending.set(request, message => { clearTimeout(timer); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result) }); socket.send(JSON.stringify({ id: request, method, params })) })
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const waitFor = async expression => assert.ok(await evaluate(`new Promise(resolve=>{ const start=Date.now(); const check=()=>{if(${expression})resolve(true);else if(Date.now()-start>12000)resolve(false);else setTimeout(check,80)};check()})`), expression)
const viewport = width => send('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile: width < 640 })
const shot = async name => {
  await evaluate('document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true)))))')
  const result = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(`.cache/page-migration/${name}.png`, Buffer.from(result.data, 'base64'))
}
try {
  for (const route of ['/', '/quienes-somos/', '/contacto/', '/newsletter/', '/preguntas-frecuentes/', '/proximos-eventos/', '/galeria/', '/politica-privacidad/', '/tag/cultura/']) {
    await send('Page.navigate', { url: origin + route })
    await waitFor('document.querySelector("main h1") && Object.keys(document.querySelector("main h1")).some(key=>key.startsWith("__reactFiber"))')
    await evaluate(`Promise.all([...document.querySelectorAll('main img')].map(img=>{img.loading='eager';return img.decode()}))`)
    assert.equal(await evaluate('new URL(document.querySelector("link[rel=canonical]").href).pathname'), route)
    for (const width of [320, 390, 768, 1440]) {
      await viewport(width)
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'), `${route} overflow at ${width}`)
    }
    if (['/', '/quienes-somos/', '/contacto/'].includes(route)) {
      const name = route === '/' ? 'home' : route.split('/')[1]
      await shot(`${name}-desktop`)
      await viewport(390)
      await shot(`${name}-mobile`)
    }
    console.log(`Browser: ${route} images, canonical and 320/390/768/1440px OK`)
  }
  await send('Page.navigate', { url: origin + '/blog/' })
  await waitFor('document.querySelector(".blog-card h2 a") && Object.keys(document.querySelector(".blog-card h2 a")).some(key=>key.startsWith("__reactFiber"))')
  await evaluate(`document.querySelector('.blog-card h2 a').click()`)
  await waitFor('document.querySelector(".article-content")')
  assert.equal(await evaluate('location.pathname.startsWith("/blog/")'), false)
  await evaluate(`document.querySelector('button[lang="en"]').click()`)
  await waitFor('document.documentElement.lang === "en"')
  assert.equal(await evaluate('document.querySelector(".blog-article").lang'), 'en')
  await evaluate(`document.querySelector('.menu-toggle').click()`)
  await waitFor('!document.querySelector("#mobile-nav").hidden')
  await evaluate(`document.querySelector('#mobile-nav a[href="/contacto/"]').click()`)
  await waitFor('location.pathname === "/contacto/" && document.querySelector("#mobile-nav").hidden')
  assert.ok(await evaluate(`Boolean(document.querySelector('main a[href^="tel:"]'))`))
  await evaluate(`document.querySelector('button[lang="es"]').click()`)
  await send('Page.navigate', { url: origin + '/' })
  await viewport(1440)
  console.log('PASS: local HTTP routing, content images, responsive layouts, article links, language switch and mobile navigation.')
} finally { socket.close() }
