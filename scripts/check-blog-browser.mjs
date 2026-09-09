// Requires a local preview on :5173 and Chrome with --remote-debugging-port=9223.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'

const origin = process.env.BLOG_PREVIEW_URL || 'http://127.0.0.1:5173'
const tabs = await (await fetch('http://127.0.0.1:9223/json/list')).json()
const tab = tabs.find(item => item.type === 'page' && item.url.startsWith(origin))
assert.ok(tab, 'Open the preview in the debugging Chrome session first')
const socket = new WebSocket(tab.webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
const errors = []
socket.onmessage = event => {
  const message = JSON.parse(event.data)
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
  if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id) }
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const request = ++id
  const timeout = setTimeout(() => { pending.delete(request); reject(new Error(`CDP timeout: ${method}`)) }, 30000)
  pending.set(request, response => { clearTimeout(timeout); response.error ? reject(new Error(JSON.stringify(response.error))) : resolve(response.result) })
  socket.send(JSON.stringify({ id: request, method, params }))
})
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails))
  return response.result.value
}
const waitFor = async expression => {
  const result = await evaluate(`new Promise(resolve => { const start = Date.now(); const check = () => { if (${expression}) resolve(true); else if (Date.now()-start>12000) resolve(false); else setTimeout(check, 80) }; check() })`)
  assert.ok(result, expression)
}
const viewport = (width, height = 1000) => send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 640 })
const navigate = async route => { await send('Page.navigate', { url: `${origin}${route}` }); await waitFor('document.querySelector("#root h1") && Object.keys(document.querySelector("#root h1")).some(key => key.startsWith("__reactFiber"))') }
const screenshot = async name => {
  await evaluate('document.fonts.ready.then(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)))))')
  const result = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(`.cache/blog-migration/${name}.png`, Buffer.from(result.data, 'base64'))
}
await mkdir('.cache/blog-migration', { recursive: true })
try {
  await send('Runtime.enable')
  await viewport(1440)
  await navigate('/blog')
  await waitFor('document.querySelectorAll(".blog-card").length === 14')
  await evaluate(`document.querySelector('button[lang="es"]').click()`)
  await evaluate(`Promise.all([...document.querySelectorAll('img')].map(img => { img.loading='eager'; return img.decode() }))`)
  await screenshot('blog-desktop')
  console.log('Listing: all 14 articles and featured images load')
  const translations = JSON.parse(await readFile('src/locales/content.en.json', 'utf8'))
  const posts = JSON.parse(await readFile('src/data/blog-posts.json', 'utf8'))
  for (const post of posts) {
    await navigate(new URL(post.sourceUrl).pathname)
    assert.equal(await evaluate('document.querySelector("h1").textContent'), post.title)
    const images = await evaluate(`Promise.all([...document.querySelectorAll('img')].map(async img => { img.loading='eager'; await img.decode(); return {src:img.getAttribute('src'),ok:img.naturalWidth>0} }))`)
    assert.ok(images.every(image => image.ok))
    assert.equal(await evaluate('document.querySelector("meta[name=description]").content'), post.excerpt)
    assert.ok((await evaluate('document.querySelector("link[rel=canonical]").href')).endsWith(new URL(post.sourceUrl).pathname))
    for (const width of [320, 390, 768, 1440]) {
      await viewport(width)
      assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Overflow: ${post.slug} at ${width}`)
    }
    if (post.id === '265') {
      const videos = await evaluate(`Promise.all([...document.querySelectorAll('video')].map(video => new Promise(resolve => { if(video.readyState>=1) resolve(true); else {video.addEventListener('loadedmetadata',()=>resolve(true),{once:true});video.addEventListener('error',()=>resolve(false),{once:true});setTimeout(()=>resolve(false),10000);video.load()} })))`)
      assert.deepEqual(videos, [true, true])
    }
    console.log(`Route and media OK: ${post.id}`)
  }
  await viewport(390, 1100)
  await navigate(new URL(posts[0].sourceUrl).pathname)
  await evaluate(`document.querySelector('.article-featured-image').decode()`)
  await screenshot('article-mobile')
  await navigate('/blog')
  for (const width of [320, 390, 768, 1440]) {
    await viewport(width)
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Listing overflow at ${width}`)
  }
  await viewport(390, 1100)
  await evaluate(`document.querySelector('.blog-card img').decode()`)
  await screenshot('blog-mobile')
  await evaluate(`document.querySelector('button[lang="en"]').click()`)
  await waitFor('document.documentElement.lang === "en"')
  assert.equal(await evaluate('document.querySelector(".blog-card h2").textContent'), translations.posts[posts[0].id].title)
  await evaluate(`document.querySelector('.blog-filters button:last-child').click()`)
  await waitFor('document.querySelectorAll(".blog-card").length < 14')
  await evaluate(`document.querySelector('.blog-filters button').click()`)
  await waitFor('document.querySelectorAll(".blog-card").length === 14')
  await evaluate(`const input=document.querySelector('.blog-search input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'zavaleta'); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true}));`)
  await waitFor('document.querySelectorAll(".blog-card").length === 1')
  await evaluate(`document.querySelector('.blog-card h2 a').click()`)
  await waitFor('document.querySelector(".article-content")')
  assert.equal(await evaluate('document.querySelector("h1").textContent'), translations.posts[posts[0].id].title)
  assert.equal(await evaluate('document.querySelector("meta[name=description]").content'), translations.posts[posts[0].id].excerpt)
  await navigate('/blog/not-an-article')
  assert.equal(await evaluate('document.querySelector(".status-symbol").textContent'), '404')
  assert.equal(await evaluate('document.querySelector("meta[name=robots]").content'), 'noindex')
  await evaluate(`document.querySelector('.brand').click()`)
  await waitFor('document.querySelector(".original-hero")')
  assert.equal(await evaluate('document.querySelectorAll("[data-blog-meta]").length'), 0)
  assert.ok(await evaluate('Boolean(document.querySelector(".timer"))'))
  await evaluate(`document.querySelector('button[lang="es"]').click()`)
  await navigate('/galeria')
  assert.ok(await evaluate('Boolean(document.querySelector(".page-galeria"))'))
  assert.equal(errors.length, 0, `Browser exceptions: ${errors.join(', ')}`)
  await navigate('/blog')
  await viewport(1440)
  console.log('PASS: 14 routes, photos, videos, ES/EN, category filter, search, 404, metadata, responsive layouts and home/gallery regression checks.')
} finally { socket.close() }
