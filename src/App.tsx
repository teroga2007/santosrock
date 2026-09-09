import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowRight, ArrowUpRight, Globe2, Menu, X, Construction } from 'lucide-react'
import Blog from './blog/Blog'
import SitePages from './site/SitePages'
import Seo from './site/Seo'
import EntranceAnimations from './site/EntranceAnimations'
import SocialLinks from './site/SocialLinks'
import { redirectFor, resolveRoute } from './site/routes'
import './site/theme-2027.css'

const links = [{ key: 'home', to: '/' }, { key: 'about', to: '/quienes-somos/' }, { key: 'contact', to: '/contacto/' }, { key: 'gallery', to: '/galeria/' }, { key: 'blog', to: '/blog/' }]
const secondary = [{ key: 'faq', to: '/preguntas-frecuentes/' }, { key: 'events', to: '/proximos-eventos/' }, { key: 'newsletter', to: '/newsletter/' }, { key: 'privacy', to: '/politica-privacidad/' }]

function Brand() {
  return <Link to="/" className="brand" aria-label="Santos Rock"><img src="/logo_SR_blanco.png" alt="Santos Rock" width="1920" height="1080" /></Link>
}

function StatusPage({ notFound = false }: { notFound?: boolean }) {
  const { t } = useTranslation()
  return <section className="status-page"><div className="status-symbol">{notFound ? '404' : <Construction size={66} strokeWidth={1.3} />}</div><h1>{t(notFound ? 'status.notFoundTitle' : 'status.title')}</h1><p>{t(notFound ? 'status.notFoundDescription' : 'status.description')}</p><Link to="/" className="btn btn-primary">{t('status.home')}<ArrowRight size={18} /></Link></section>
}

export default function App() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const route = resolveRoute(location.pathname)
  const redirect = redirectFor(location.pathname)
  const hashRedirect = location.pathname === '/' && location.hash === '#sobre' ? '/quienes-somos/' : location.pathname === '/' && location.hash === '#contacto' ? '/contacto/' : undefined
  useEffect(() => {
    document.documentElement.lang = i18n.language
    try { localStorage.setItem('santosrock-language', i18n.language) } catch { /* Storage is optional. */ }
  }, [i18n.language])
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView()
    else window.scrollTo(0, 0)
    document.getElementById('main-content')?.focus({ preventScroll: true })
  }, [location])
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  const isActive = (key: string, to: string) => route.path === to || (key === 'blog' && Boolean(route.post || route.tag))
  let content
  if (redirect || hashRedirect) content = <Navigate to={(hashRedirect || redirect)! + location.search + (hashRedirect ? '' : location.hash)} replace />
  else if (route.page) content = <SitePages page={route.page} />
  else if (route.post || route.tag || route.isBlog) content = <Blog slug={route.post?.slug} tagSlug={route.tag?.slug} />
  else content = <StatusPage notFound={route.path !== '/en-construccion/'} />

  return <>
    <Seo />
    <EntranceAnimations />
    <a className="skip-link" href="#main-content">{t('nav.skip')}</a>
    <header className="site-header"><div className="navbar header-inner"><Brand />
      <nav className="desktop-nav" aria-label={t('nav.open')}>{links.map(link => <Link key={link.key} className={isActive(link.key, link.to) ? 'active' : ''} aria-current={isActive(link.key, link.to) ? 'page' : undefined} to={link.to}>{t(`nav.${link.key}`)}</Link>)}</nav>
      <div className="header-actions"><div className="language-switch" role="group" aria-label={t('nav.language')}><Globe2 size={15} />{['es', 'en'].map(lang => <button key={lang} lang={lang} aria-pressed={i18n.language === lang} onClick={() => void i18n.changeLanguage(lang)}>{lang.toUpperCase()}</button>)}</div><button className="btn btn-ghost menu-toggle" aria-label={t(menuOpen ? 'nav.close' : 'nav.open')} aria-expanded={menuOpen} aria-controls="mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
    </div><nav id="mobile-nav" className="mobile-nav" hidden={!menuOpen} aria-label={t('nav.open')}>{links.map(link => <Link key={link.key} to={link.to} onClick={() => setMenuOpen(false)}>{t(`nav.${link.key}`)}<ArrowUpRight size={17} /></Link>)}</nav></header>
    <main id="main-content" tabIndex={-1}>{content}</main>
    <footer className="site-footer"><div><Brand /><p>{t('footer.tagline')}</p><SocialLinks /></div><nav className="footer-secondary" aria-label={t('site.more')}>{secondary.map(link => <Link key={link.key} to={link.to}>{t(`site.${link.key}`)}</Link>)}</nav><p>© {new Date().getFullYear()} Santos Rock<br />{t('footer.copyright')}</p><a href="#" className="back-top" aria-label={t('footer.back')} onClick={event => { event.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><ArrowDown size={20} /></a></footer>
  </>
}
