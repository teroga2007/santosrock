import { load } from 'cheerio'

export function textNodes(html) {
  const $ = load(html, null, false)
  const nodes = []
  function visit(node) {
    if (node.type === 'text' && node.data.trim()) nodes.push(node)
    for (const child of node.children || []) visit(child)
  }
  visit($.root()[0])
  return { $, nodes }
}

export function postUnits(post) {
  return [post.title, post.excerpt, ...textNodes(post.content).nodes.map(node => node.data.trim())]
}
export function pageUnits(page) {
  return [page.title, page.description, ...page.sections.flatMap(section => textNodes(section.html).nodes.map(node => node.data.trim()))]
}
