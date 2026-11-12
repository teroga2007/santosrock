import { ArrowUpRight, Globe2, Instagram, Facebook, MessageCircle, Radio, Ticket, Music2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CosmicBackdrop from './CosmicBackdrop'

const destinations = [
  { id: 'sinpe', href: 'https://wa.me/50686896331', Icon: MessageCircle },
  { id: 'tickets', href: 'https://latiqueteracr.com/producto/festival-santos-rock-2027/', Icon: Ticket },
  { id: 'channel', href: 'https://whatsapp.com/channel/0029VbAgWqlBfxoB4DSLkl0N', Icon: Radio },
  { id: 'web', href: '/', Icon: Globe2 },
  { id: 'instagram', href: 'https://www.instagram.com/santosrockcr', Icon: Instagram },
  { id: 'tiktok', href: 'https://www.tiktok.com/@santos.rock', Icon: Music2 },
  { id: 'facebook', href: 'https://www.facebook.com/santosrockfest', Icon: Facebook },
]

export default function LinksPage() {
  const { t } = useTranslation()
  return <div className="links-page">
    <CosmicBackdrop />
    <div className="links-orbit" aria-hidden="true" />
    <div className="links-content">
      <h1>Santos Rock<span>Los Santos, Costa Rica</span></h1>
      <p className="links-intro">{t('linkHub.intro')}</p>
      <Link className="links-festival" to="/#entradas"><span>SANTOS ROCK 2027</span><span>{t('landing.headliner')}</span><strong>COCOFUNKA</strong><span className="links-more-bands">{t('landing.moreBands')}</span><span>{t('linkHub.festival')}</span><span className="links-festival-action">{t('linkHub.prices')}<ArrowUpRight size={18} aria-hidden="true" /></span></Link>
      <nav className="links-destinations" aria-label={t('linkHub.title')}>
        {destinations.map(({ id, href, Icon }) => {
          const content = <><span className="links-icon"><Icon size={23} strokeWidth={1.6} aria-hidden="true" /></span><span><strong>{t(`linkHub.${id}`)}</strong><small>{t(`linkHub.${id}Detail`)}</small></span><ArrowUpRight size={19} aria-hidden="true" /></>
          return href === '/' ? <Link key={id} to={href} className="links-card">{content}</Link> : <a key={id} href={href} className={`links-card${id === 'sinpe' ? ' links-card-primary' : ''}`} target="_blank" rel="noopener noreferrer">{content}<span className="sr-only"> ({t('site.newTab')})</span></a>
        })}
      </nav>
      <p className="links-signoff">{t('footer.tagline')}</p>
      <Link className="links-domain" to="/">santosrock.com</Link>
    </div>
  </div>
}
