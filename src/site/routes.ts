import i18n from '../i18n'
import { localizePost, localizePage, categoryLabel } from './editorial'
import posts from '../data/blog-posts.json'
import pages from '../data/site-pages.json'
import legacy from '../data/legacy-routes.json'

export { posts, pages, legacy }
export const normalizePath = (path: string) => path === '/' ? '/' : `${path.replace(/\/+$/, '')}/`
export const postPath = (post: { sourceUrl?: string; slug: string }) => post.sourceUrl ? new URL(post.sourceUrl).pathname : `/${post.slug}/`
export const canonicalPaths = ['/', '/blog/', ...pages.filter(page => page.path !== '/').map(page => page.path), ...posts.map(postPath), ...legacy.tags.map(tag => `/tag/${tag.slug}/`)]

export function resolveRoute(pathname: string) {
  const path = normalizePath(pathname)
  const post = posts.find(post => postPath(post) === path)
  const page = pages.find(page => page.path === path)
  const tag = legacy.tags.find(tag => `/tag/${tag.slug}/` === path)
  return { path, post, page, tag, isBlog: path === '/blog/', found: Boolean(post || page || tag || path === '/blog/') }
}

export function redirectFor(pathname: string) {
  const alias = legacy.redirects.find(redirect => redirect.from === pathname)
  if (alias) return alias.to
  const route = resolveRoute(pathname)
  return route.found && route.path !== pathname ? route.path : undefined
}

export function metadataFor(pathname: string, language = 'es') {
  const route = resolveRoute(pathname)
  if (route.post) route.post = localizePost(route.post, language)
  if (route.page) route.page = localizePage(route.page, language)
  const t = i18n.getFixedT(language)
  const title = route.post ? `${route.post.title} | Santos Rock` : route.page?.path === '/' ? t('meta') : route.page ? `${route.page.title} | Santos Rock` : route.tag ? `${categoryLabel(route.tag.name, language)} | Santos Rock` : route.isBlog ? 'Blog | Santos Rock' : '404 | Santos Rock'
  const description = route.post?.excerpt || (route.page?.path === '/' ? t('meta') : route.page?.description) || (route.tag ? `Santos Rock · ${categoryLabel(route.tag.name, language)}` : route.isBlog ? t('blog.intro') : t('status.notFoundDescription'))
  const image = route.post?.thumbnail || route.page?.sections.flatMap(section => section.backgrounds).find(Boolean) || ''
  return { title, description, image, path: route.path, noindex: !route.found, type: route.post ? 'article' : 'website' }
}
