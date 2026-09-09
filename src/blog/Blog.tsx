import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowUpRight, Search, X } from 'lucide-react'
import { posts, postPath, legacy } from '../site/routes'
import { localizePost, categoryLabel } from '../site/editorial'
import type { BlogPost } from './types'
import './blog.css'

function PostDate({ date }: { date?: string }) {
  const { i18n } = useTranslation()
  if (!date) return null
  // WordPress supplies a local editorial date. Parse only its calendar portion.
  const formatted = new Intl.DateTimeFormat(i18n.language === 'en' ? 'en' : 'es-CR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date.slice(0, 10)}T12:00:00Z`))
  return <time dateTime={date.slice(0, 10)}>{formatted}</time>
}

function BlogListing({ tagSlug }: { tagSlug?: string }) {
  const { t, i18n } = useTranslation()
  const [category, setCategory] = useState('')
  const [query, setQuery] = useState('')
  const tag = legacy.tags.find(tag => tag.slug === tagSlug)
  const categories = [...new Set(posts.flatMap(post => post.categories))]
  const filtered = useMemo(() => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const search = normalize(query.trim())
    return posts.map(post => localizePost(post, i18n.language)).filter(post => (!tag || tag.postIds.includes(post.id)) && (!category || post.categories.includes(category)) && normalize(`${post.title} ${post.excerpt}`).includes(search))
  }, [category, query, tag, i18n.language])
  return <div className="blog-page">
    <header className="blog-heading"><p className="eyebrow"><span className="orange-line" />Santos Rock / Blog</p><h1>{tag ? categoryLabel(tag.name, i18n.language) : t('blog.title')}</h1><p className="blog-intro">{t('blog.intro')}</p></header>
    <div className="blog-toolbar"><div className="blog-filters" role="group" aria-label={t('blog.filter')}><button className={`btn btn-sm ${category === '' ? 'btn-primary' : 'btn-ghost'}`} aria-pressed={category === ''} onClick={() => setCategory('')}>{t('blog.all')}</button>{categories.map(value => <button lang={i18n.language} className={`btn btn-sm ${category === value ? 'btn-primary' : 'btn-ghost'}`} key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{categoryLabel(value, i18n.language)}</button>)}</div><label className="input blog-search"><Search size={17} aria-hidden="true" /><input type="search" aria-label={t('blog.search')} placeholder={t('blog.search')} value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <p className="blog-count" role="status">{t('blog.count', { count: filtered.length })}</p>
    <div className="blog-grid">{filtered.map(post => <article className="card blog-card" key={post.id} lang={i18n.language}><Link to={postPath(post)} className="blog-card-image" tabIndex={-1} aria-hidden="true"><img src={post.thumbnail} alt="" loading="lazy" decoding="async" /></Link><div className="blog-card-body"><div className="blog-card-meta"><span>{categoryLabel(post.category, i18n.language)}</span><PostDate date={post.date} /></div><h2><Link to={postPath(post)}>{post.title}</Link></h2><p className="blog-excerpt">{post.excerpt}</p><Link to={postPath(post)} className="blog-read-more" aria-label={`${t('blog.readMore')}: ${post.title}`}><span>{t('blog.readMore')}</span><ArrowUpRight size={18} /></Link></div></article>)}</div>
    {filtered.length === 0 && <div className="blog-empty"><Search size={34} /><h2>{t('blog.empty')}</h2><button className="btn btn-primary" onClick={() => { setQuery(''); setCategory('') }}>{t('blog.reset')}<X size={16} /></button></div>}
  </div>
}

function Article({ post }: { post: BlogPost }) {
  const { t, i18n } = useTranslation()
  return <article className="blog-article" lang={i18n.language}>
    <Link to="/blog/" className="blog-back"><ArrowLeft size={17} />{t('blog.back')}</Link>
    <header className="article-heading"><div className="article-categories">{post.categories.map(category => <span className="badge" key={category}>{categoryLabel(category, i18n.language)}</span>)}</div><h1>{post.title}</h1><PostDate date={post.date} /></header>
    <img className="article-featured-image" src={post.thumbnail} alt={post.title} fetchPriority="high" />
    {/* Committed static HTML, extracted and allowlist-sanitized by migrate-blog.mjs.
        Never pass live WordPress responses or user input to this renderer. */}
    <div className="article-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    <footer className="article-footer"><Link to="/blog/" className="btn btn-primary"><ArrowLeft size={17} />{t('blog.back')}</Link></footer>
  </article>
}

export default function Blog({ slug, tagSlug }: { slug?: string; tagSlug?: string }) {
  const { t, i18n } = useTranslation()
  const post = slug ? posts.find(item => item.slug === slug) : undefined
  const missing = Boolean(slug && !post)
  if (missing) return <section className="status-page"><div className="status-symbol">404</div><h1>{t('status.notFoundTitle')}</h1><p>{t('status.notFoundDescription')}</p><Link className="btn btn-primary" to="/blog/">{t('blog.back')}<ArrowLeft size={18} /></Link></section>
  return post ? <Article post={localizePost(post, i18n.language)} /> : <BlogListing tagSlug={tagSlug} />
}
