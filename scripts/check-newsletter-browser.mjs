import assert from 'node:assert/strict'
const tabs = await (await fetch('http://127.0.0.1:9223/json/list')).json()
const socket = new WebSocket(tabs.find(tab => tab.type === 'page' && tab.url.startsWith('http://127.0.0.1:5173')).webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
let id = 0
const pending = new Map()
socket.onmessage = event => { const message = JSON.parse(event.data); if (message.id) { pending.get(message.id)(message); pending.delete(message.id) } }
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const request = ++id
  const timer = setTimeout(() => reject(new Error(method)), 15000)
  pending.set(request, message => { clearTimeout(timer); message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result) })
  socket.send(JSON.stringify({ id: request, method, params }))
})
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}
const wait = async expression => assert.ok(await evaluate(`new Promise(resolve=>{let tries=0;const check=()=>{if(${expression})resolve(true);else if(tries++>100)resolve(false);else setTimeout(check,60)};check()})`))
try {
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/newsletter/' })
  await wait(`document.querySelector('form') && Object.keys(document.querySelector('form')).some(key=>key.startsWith('__reactFiber'))`)
  assert.equal(await evaluate(`document.querySelector('form').checkValidity()`), false)
  await evaluate(`document.querySelector('#newsletter-email').value='reader@example.com'`)
  assert.equal(await evaluate(`document.querySelector('form').checkValidity()`), false)
  await evaluate(`document.querySelector('[name=consent]').click(); window.originalFetch=window.fetch; window.fetch=async (url, options)=>{window.sentBody=options.body;return {ok:false}};document.querySelector('form').requestSubmit()`)
  await wait(`document.querySelector('.newsletter-feedback[role=alert]')`)
  assert.equal(await evaluate(`document.querySelector('#newsletter-email').value`), 'reader@example.com')
  await evaluate(`window.fetch=async (url, options)=>{window.sentBody=options.body;return {ok:true}};document.querySelector('form').requestSubmit()`)
  await wait(`document.querySelector('button[type=submit]').disabled && document.querySelector('.newsletter-feedback[role=status]').textContent.length>0`)
  const body = new URLSearchParams(await evaluate('window.sentBody'))
  assert.equal(body.get('email'), 'reader@example.com')
  assert.equal(body.get('consent'), 'yes')
  assert.equal(body.get('form-name'), 'newsletter')
  assert.equal(body.get('bot-field'), '')
  assert.ok(['es', 'en'].includes(body.get('language')))
  await evaluate('window.fetch=window.originalFetch')
  console.log('PASS: required email/consent, encoded payload, error retry and success state (mocked transport; no real submission).')
} finally { socket.close() }
