import { load } from 'cheerio'
import sanitizeHtml from 'sanitize-html'

export const spamPattern = /\b(casino|gambling|betting|sportsbook|1xbet|pin[\s-]?up|southwind|bonus\s+codes?|wagering|slots)\b/i
export const trustedEmbed = value => {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false
    return (url.hostname === 'open.spotify.com' && /^\/embed\/(track|artist|album|playlist)\/[a-zA-Z0-9]+\/?$/.test(url.pathname)) ||
      (url.hostname === 'www.instagram.com' && /^\/(p|reel)\/[\w-]+\/embed\/?$/.test(url.pathname))
  } catch { return false }
}

export function sanitizeEditorial(html) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'div', 'blockquote', 'cite', 'a', 'img', 'figure', 'figcaption', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub', 'iframe', 'video', 'audio', 'source'],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'], img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      div: ['class'], span: ['class'], figure: ['class'], blockquote: ['cite'],
      iframe: ['src', 'title', 'width', 'height', 'loading', 'allow', 'allowfullscreen', 'sandbox', 'referrerpolicy'],
      video: ['src', 'controls', 'preload', 'poster'], audio: ['src', 'controls', 'preload'], source: ['src', 'type'],
      th: ['scope', 'colspan', 'rowspan'], td: ['colspan', 'rowspan'], ol: ['start'],
    },
    allowedClasses: { div: ['article-gallery', 'article-embed'], figure: ['article-embed'], span: ['article-dropcap'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['https'], iframe: ['https'], video: ['https'], audio: ['https'], source: ['https'] },
    allowProtocolRelative: false,
    allowedIframeHostnames: ['open.spotify.com', 'www.instagram.com'],
    exclusiveFilter: frame => frame.tag === 'iframe' && !trustedEmbed(frame.attribs.src),
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}) } }),
      iframe: (tagName, attribs) => ({ tagName, attribs: { ...attribs, title: attribs.title || (attribs.src?.includes('instagram.com') ? 'Instagram' : 'Spotify'), loading: 'lazy', sandbox: 'allow-scripts allow-same-origin allow-popups', referrerpolicy: 'strict-origin-when-cross-origin', allow: 'encrypted-media; fullscreen; picture-in-picture' } }),
    },
  })
}

export function plainText(html) {
  const $ = load(html, null, false)
  $('br').replaceWith('\n')
  return $.root().text().trim()
}

// The reviewed Elementor posts all use this section for the article body.
// Do not fall back to the entire WordPress page if the template changes.
export function extractEditorial(post) {
  const $ = load(post.content.rendered)
  const section = $('[data-elementor-type="wp-post"] > section[data-id="5aa35477"]')
  if (section.length !== 1) throw new Error(`Manual review required: article container changed for ${post.id}`)
  const body = load(section.html(), null, false)
  const droppedEmbeds = []
  body('script, style, nav, footer, form, button, input, svg').remove()
  body('[data-widget_type="divider.default"]').remove()

  // Elementor stores decorative opening letters as standalone headings.
  // Reattach the exact letter to its paragraph without editing the prose.
  const firstHeading = body('[data-widget_type="heading.default"]').first()
  const letter = firstHeading.text().trim()
  if (/^[A-ZÁÉÍÓÚÑ]$/.test(letter)) {
    const paragraph = body('[data-widget_type="text-editor.default"] p').first()
    if (!paragraph.length) throw new Error(`Missing opening paragraph: ${post.id}`)
    paragraph.prepend(`<span class="article-dropcap">${letter}</span>`)
    firstHeading.remove()
  }

  body('[data-widget_type="image-gallery.default"]').each((_, el) => {
    body(el).attr('class', 'article-gallery')
  })
  body('[data-instgrm-permalink]').each((_, el) => {
    const original = body(el).attr('data-instgrm-permalink')
    const url = new URL(original)
    if (url.hostname !== 'www.instagram.com' || url.protocol !== 'https:' || !/^\/(reel|p)\/[\w-]+\/$/.test(url.pathname)) {
      droppedEmbeds.push(original)
      body(el).remove()
      return
    }
    const wrapper = body('<figure class="article-embed"></figure>')
    wrapper.append(body('<iframe height="640" width="400"></iframe>').attr('src', `${url.origin}${url.pathname}embed/`))
    // Keep the original provider's textual fallback and links. No old scripts execute.
    body(el).find('p').each((_, paragraph) => wrapper.append(body(paragraph).clone()))
    body(el).replaceWith(wrapper)
  })
  body('iframe').each((_, el) => {
    if (!trustedEmbed(body(el).attr('src'))) { droppedEmbeds.push(body(el).attr('src')); body(el).remove() }
  })
  // Preserve emphasis that was expressed with inline WordPress styles.
  body('[style]').each((_, el) => {
    const style = body(el).attr('style')
    if (/font-weight\s*:\s*(bold|[6-9]00)/i.test(style) && !['b', 'strong'].includes(el.tagName)) body(el).wrapInner('<strong></strong>')
    if (/font-style\s*:\s*italic/i.test(style) && !['i', 'em'].includes(el.tagName)) body(el).wrapInner('<em></em>')
  })
  body('div,span').toArray().reverse().forEach(el => {
    if (!['article-gallery', 'article-embed', 'article-dropcap'].includes(body(el).attr('class'))) body(el).replaceWith(body(el).contents())
  })
  return { content: sanitizeEditorial(body.html()), droppedEmbeds }
}
