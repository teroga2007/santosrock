import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUpRight, MapPin } from 'lucide-react'
import { pages, posts, postPath } from './routes'
import Countdown from './Countdown'
import Newsletter from './Newsletter'
import CosmicBackdrop from './CosmicBackdrop'
import FestivalCharacter from './FestivalCharacter'
import { useTicketPhase } from './TicketPhase'
import { ticketPhases, formatTicketPrice } from './tickets'
import { localizePage, localizePost, categoryLabel } from './editorial'
import './site-pages.css'

type Page = typeof pages[number]
type Section = Page['sections'][number]

function ImportedHtml({ html, className = '' }: { html: string; className?: string }) {
  const { i18n } = useTranslation()
  return <div className={`original-copy ${className}`} lang={i18n.language} dangerouslySetInnerHTML={{ __html: html }} />
}

function SectionContent({ section }: { section: Section }) {
  const { t, i18n } = useTranslation()
  const isRegion = section.id === '713f885b'
  const photos = isRegion ? section.backgrounds.filter(image => /\/(130|5|16)\.jpg$/.test(image)) : []
  const isCulture = section.id === '54dbc2b8'
  const isContact = section.id === '5b35a91'
  const parts = isContact ? section.html.split(/(?=<h2>(?:Información|INFORMATION)<\/h2>)/) : []
  return <section className={`migrated-section section-${section.id}${isCulture ? ' culture-section' : ''}`}>
    {section.id === 'db6672e' && <div className="sponsor-heading"><p className="eyebrow">{t('site.sponsorLabel')}</p><h2>{t('site.sponsors')}</h2></div>}
    {isContact ? <div className="original-contact-grid"><ImportedHtml html={parts[0]} /><ImportedHtml html={parts[1] || ''} className="contact-information" /></div> : <ImportedHtml html={section.html} />}
    {section.id === '135f2025' && <FestivalCharacter character="vaca" className="community-cow" />}
    {isCulture && <div className="original-video culture-video"><iframe src="https://www.youtube-nocookie.com/embed/a2M5F3Dw3nM" title="Santos Rock — Cultura que transforma" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div>}
    {photos.length > 0 && <div className="region-photos">{photos.map(photo => <img src={photo} key={photo} alt={i18n.language === 'en' ? 'Los Santos region' : 'Zona de Los Santos'} loading="lazy" />)}</div>}
    {section.maps.map(map => <div className="original-map" key={map.src}><iframe src={map.src} title={map.title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /><a href={map.src.replace('&output=embed', '')} target="_blank" rel="noopener noreferrer"><MapPin size={15} />{map.title}<ArrowUpRight size={15} /></a></div>)}
  </section>
}

function Home({ page }: { page: Page }) {
  const { t, i18n } = useTranslation()
  const phase = useTicketPhase()
  const currentTicket = ticketPhases[phase]
  return <div className="festival-home">
    <CosmicBackdrop />
    <section className="original-hero hero-encounter" id="inicio">
      <div className="original-hero-copy" lang={i18n.language}>
        <p className="landing-signal"><span className="live-dot" />{t('landing.edition')}</p>
        <h1 className="landing-title">COCOFUNKA<br /><span>{t('landing.lands')}</span><br />El Guayabal<i>.</i></h1>
        <p className="hero-intro">{t('landing.intro')}</p>
        <p className="landing-date"><MapPin size={16} /><span>{t('landing.date')}</span></p>
        <div className="ticket-panel" aria-labelledby="ticket-heading">
          <div className="ticket-price"><div><h2 id="ticket-heading">{t('landing.tickets')} · {t(`landing.${currentTicket.id}`)}</h2><strong>{formatTicketPrice(currentTicket.price)}</strong></div><p className="ticket-current">{t('landing.current')}</p></div>
          <p className="ticket-validity">{t(`landing.validity${phase}`)}</p>
          <dl className="ticket-comparison">
            {ticketPhases.map((ticket, index) => index === phase ? null : <div key={ticket.id}><dt>{t(`landing.${ticket.id}`)} <span>{t(index < phase ? 'landing.closed' : `landing.starts${index}`)}</span></dt><dd>{index < phase ? <s>{formatTicketPrice(ticket.price)}</s> : formatTicketPrice(ticket.price)}</dd></div>)}
          </dl>
          {phase < 2 && <p className="ticket-saving">{t('landing.saving', { amount: formatTicketPrice(ticketPhases[2].price - currentTicket.price), phase: t(`landing.${currentTicket.id}`) })}</p>}
          <a className="btn btn-primary ticket-buy" href="https://latiqueteracr.com/producto/festival-santos-rock-2027/" target="_blank" rel="noopener noreferrer">{t('landing.buy')}<ArrowUpRight size={19} aria-hidden="true" /><span className="sr-only"> ({t('site.newTab')})</span></a>
          <p className="ticket-sinpe">{t('landing.sinpe')} <strong>8689 6331</strong></p>
        </div>
        <a className="hero-explore" href="#lineup">{t('landing.explore')}<ArrowDown size={18} aria-hidden="true" /></a>
      </div>
      <div className="hero-character-scene"><div className="hero-orbit" /><FestivalCharacter character="pua" priority /><p className="character-caption"><span>Púa</span>{t('hero.puaCaption')}</p></div>
    </section>
    <section className="lineup-transmission" id="lineup" aria-labelledby="lineup-title">
      <div><p className="eyebrow">LINEUP / 2027</p><h2 id="lineup-title">{t('landing.lineup')}</h2><p>{t('landing.soon')}</p></div>
      <Link className="btn btn-ghost" to="/newsletter/">{t('landing.notify')}<ArrowUpRight size={18} aria-hidden="true" /></Link>
    </section>
    <Countdown />
    <div className="original-home-sections" id="encuentro">{page.sections.slice(1, -1).map(section => <SectionContent key={section.id} section={section} />)}</div>
    <section className="home-notes"><p className="eyebrow">Santos Rock / BLOG</p><h2 lang={i18n.language}>{t('site.latest')}</h2><div className="home-notes-grid">{posts.slice(0, 3).map(post => localizePost(post, i18n.language)).map(post => <article key={post.id} lang={i18n.language}><Link to={postPath(post)}><img src={post.thumbnail} alt="" loading="lazy" /><span>{categoryLabel(post.category, i18n.language)}</span><h3>{post.title}</h3></Link><p>{post.excerpt}</p><Link className="home-read" to={postPath(post)}>{t('blog.readMore')}<ArrowUpRight size={18} /></Link></article>)}</div><Link className="btn btn-ghost" to="/blog/">{t('nav.blog')}<ArrowUpRight size={18} /></Link></section>
  </div>
}

export default function SitePages({ page: originalPage }: { page: Page }) {
  const { t, i18n } = useTranslation()
  const page = localizePage(originalPage, i18n.language)
  if (page.path === '/') return <Home page={page} />
  const privacy = page.slug === 'politica-privacidad'
  const heroImage = privacy ? undefined : page.sections[0].backgrounds[0]
  return <div className={`original-page page-${page.slug}`}>
    <header className={`original-page-heading${heroImage ? ' has-photo' : ''}`}>
      {heroImage && <img src={heroImage} alt="" fetchPriority="high" />}
      <div><p className="eyebrow">Santos Rock / <span lang={i18n.language}>{page.title}</span></p><h1 lang={i18n.language}>{page.title}</h1>{page.slug === 'newsletter' && <p lang={i18n.language}>{t('site.newsletterIntro')}</p>}</div>
    </header>
    <div className="original-page-sections">{page.slug === 'newsletter' ? <Newsletter /> : (privacy ? page.sections : page.sections.slice(1)).map(section => <SectionContent key={section.id} section={section} />)}</div>
  </div>
}
