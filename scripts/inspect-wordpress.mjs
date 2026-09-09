import { readFile } from 'node:fs/promises'
import { load } from 'cheerio'

const posts = JSON.parse(await readFile(process.argv[2], 'utf8'))
for (const post of posts) {
  const $ = load(post.content.rendered)
  $('nav,footer,script,style').remove()
  const widgets = $('[data-widget_type]').map((_, el) => ({
    type: $(el).attr('data-widget_type'),
    text: $(el).text().replace(/\s+/g, ' ').trim().slice(0, 130),
    images: $(el).find('img').length,
  })).get()
  console.log(JSON.stringify({ id: post.id, title: post.title.rendered, excerpt: post.excerpt.rendered,
    categories: post._embedded['wp:term'].flat().filter(x => x.taxonomy === 'category').map(x => x.name),
    featured: post._embedded['wp:featuredmedia']?.[0]?.source_url,
    widgets, iframes: $('iframe').map((_, el) => $(el).attr('src')).get(),
    embeds: $('[data-instgrm-permalink]').map((_, el) => $(el).attr('data-instgrm-permalink')).get(),
  }, null, 2))
}
