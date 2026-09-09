import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export default defineConfig({ server: { watch: { ignored: ['**/.cache/**'] } }, plugins: [react(), tailwindcss(), {
  name: 'santosrock-preview-routes',
  configurePreviewServer(server) {
    // Preview the same HTTP behavior as the generated production hosting rules.
    const report = JSON.parse(readFileSync('docs/route-migration-report.json', 'utf8')) as { redirects: { from: string; to: string }[]; feeds: string[] }
    const directory = path.resolve('dist')
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url || '/', 'http://localhost')
      const redirect = report.redirects.find(rule => rule.from === url.pathname)
      if (redirect) {
        response.writeHead(301, { Location: redirect.to + url.search })
        response.end()
        return
      }
      if (report.feeds.includes(url.pathname)) {
        response.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
        response.end(readFileSync(path.join(directory, url.pathname, 'index.xml')))
        return
      }
      const target = path.resolve(directory, '.' + decodeURIComponent(url.pathname))
      if (target !== directory && (!target.startsWith(directory + path.sep) || !existsSync(target))) {
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/html; charset=utf-8')
        response.end(readFileSync(path.join(directory, '404.html')))
        return
      }
      next()
    })
  },
}] })
