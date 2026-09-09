import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const tabs = await (await fetch('http://127.0.0.1:9223/json/list')).json()
const socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
socket.onmessage = event => { const m = JSON.parse(event.data); if (m.id) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params = {}) => new Promise((resolve, reject) => { const n = ++id; pending.set(n, m => m.error ? reject(m.error) : resolve(m.result)); socket.send(JSON.stringify({ id: n, method, params })) })
const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw r.exceptionDetails; return r.result.value }
const waitFor = async expression => assert.ok(await evaluate(`new Promise(resolve => { const start = Date.now(); const check = () => { if (${expression}) resolve(true); else if (Date.now() - start > 15000) resolve(false); else setTimeout(check, 80) }; check() })`))
try {
  for (const width of [320, 390, 768, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 640 })
    await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
    await waitFor('document.querySelector(".sponsor-logos")')
    await evaluate(`Promise.all([...document.querySelectorAll('.hero-encounter img')].map(i => i.decode()))`)
    assert.equal(await evaluate('document.querySelectorAll(".site-header .social-links").length'), 0)
    assert.equal(await evaluate('document.querySelectorAll("footer .social-links a").length'), 4)
    await evaluate('new Promise(r => setTimeout(r,650))')
    const heroShot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(`.cache/hero-${width}.png`, Buffer.from(heroShot.data, 'base64'))
    await evaluate(`Promise.all([...document.querySelectorAll('.sponsor-logos img')].map(i => { i.loading = 'eager'; return i.decode() }))`)
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `overflow ${width}`)
    assert.equal(await evaluate('document.querySelectorAll(".sponsor-logos img").length'), 4)
    assert.equal(await evaluate('document.querySelectorAll("footer a[href=\'/feed/\']").length'), 0)
    assert.ok(await evaluate(`[...document.querySelectorAll('.social-links a')].every(a => a.target === '_blank' && a.rel.includes('noopener'))`))
    await evaluate('document.querySelector(".sponsor-heading").scrollIntoView({behavior:"instant",block:"start"})')
    await evaluate('new Promise(r => setTimeout(r,700))')
    const screenshot = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(`.cache/presentation-${width}.png`, Buffer.from(screenshot.data, 'base64'))
    console.log(`PASS ${width}px: logos, social links, no RSS, no overflow`)
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  await waitFor('document.querySelector(".sponsor-logos")')
  assert.equal(await evaluate('document.getAnimations().length'), 0)
  await evaluate(`document.querySelector('button[lang="en"]').click()`)
  await waitFor('document.documentElement.lang === "en"')
  assert.equal(await evaluate('document.querySelector(".sponsor-heading h2").textContent'), 'Making it happen together')
  await evaluate(`document.querySelector('button[lang="es"]').click()`)
  console.log('PASS reduced motion and translated sponsor heading')
} finally { socket.close() }
