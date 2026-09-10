// Remove WordPress spacer paragraphs while keeping ordinary paragraph boundaries.
export function normalizeEditorialSpacing(html) {
  return html
    .replace(/<p\b[^>]*>(?:\s|&nbsp;|&#160;|&#x0*a0;|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/<br\s*\/?>(?:(?:\s|&nbsp;|&#160;|&#x0*a0;)*<br\s*\/?>)+/gi, '<br />')
    .replace(/(?:\r?\n)[\t ]*(?:(?:\r?\n)[\t ]*)+/g, '\n')
}
