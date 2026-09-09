import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { metadataFor, redirectFor } from './routes'

export default function Seo() {
  const { i18n } = useTranslation()
  const { pathname } = useLocation()
  const metadata = metadataFor(redirectFor(pathname) || pathname, i18n.language)
  const { title, description, image, path, noindex, type } = metadata
  useEffect(() => {
    const origin = new URL(import.meta.env.VITE_SITE_URL || 'https://santosrock.com').origin
    document.title = title
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.head.querySelectorAll('[data-site-meta],[data-blog-meta]').forEach(node => node.remove())
    const nodes: HTMLElement[] = []
    const addMeta = (key: string, value: string, property = true) => {
      const node = document.createElement('meta')
      node.setAttribute(property ? 'property' : 'name', key)
      node.content = value
      node.dataset.siteMeta = ''
      document.head.append(node)
      nodes.push(node)
    }
    if (noindex) addMeta('robots', 'noindex', false)
    else {
      const canonical = document.createElement('link')
      canonical.rel = 'canonical'
      canonical.href = origin + path
      canonical.dataset.siteMeta = ''
      document.head.append(canonical)
      nodes.push(canonical)
      addMeta('og:title', title)
      addMeta('og:description', description)
      addMeta('og:url', origin + path)
      addMeta('og:type', type)
      if (image) addMeta('og:image', origin + image)
    }
    return () => nodes.forEach(node => node.remove())
  }, [title, description, image, path, noindex, type])
  return null
}
