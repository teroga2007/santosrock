import i18n from '../i18n'
import type { BlogPost } from '../blog/types'
import type pages from '../data/site-pages.json'

export function localizePost<T extends BlogPost>(post: T, language: string): T {
  if (language !== 'en') return post
  const translated = i18n.getFixedT(language, 'content')(`posts.${post.id}`, { returnObjects: true })
  return typeof translated === 'object' ? { ...post, ...translated } : post
}

export function localizePage(page: typeof pages[number], language: string) {
  if (language !== 'en') return page
  const t = i18n.getFixedT(language, 'content')
  return { ...page, title: t(`pages.${page.id}.title`), description: t(`pages.${page.id}.description`),
    sections: page.sections.map(section => ({ ...section, html: t(`pages.${page.id}.sections.${section.id}`) })) }
}

export function categoryLabel(category: string, language: string) {
  return i18n.getFixedT(language)(`categories.${category}`, { defaultValue: category })
}
