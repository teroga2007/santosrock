import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { useTicketPhase } from './TicketPhase'
import { ticketPhases, formatTicketPrice } from './tickets'

export default function FestivalAnnouncement() {
  const { t } = useTranslation()
  const phase = useTicketPhase()
  const currentTicket = ticketPhases[phase]
  return <section className="festival-announcement" id="entradas" aria-labelledby="festival-announcement-title">
    <div className="announcement-copy">
      <p className="landing-signal"><span className="live-dot" />{t('landing.edition')}</p>
      <p className="announcement-headliner">{t('landing.headliner')}</p>
      <h2 id="festival-announcement-title">COCOFUNKA<br /><span>{t('landing.lands')} El Guayabal.</span></h2>
      <p className="announcement-more-bands">{t('landing.moreBands')}</p>
      <p className="hero-intro">{t('landing.intro')}</p>
      <p className="landing-date"><MapPin size={16} /><span>{t('landing.date')}</span></p>
      <div className="announcement-lineup" id="lineup"><h3>{t('landing.lineup')}</h3><p>{t('landing.soon')}</p><Link className="hero-explore" to="/newsletter/">{t('landing.notify')}<ArrowUpRight size={18} aria-hidden="true" /></Link></div>
    </div>
    <div className="ticket-panel" aria-labelledby="ticket-heading">
      <div className="ticket-price"><div><h3 id="ticket-heading">{t('landing.tickets')} · {t(`landing.${currentTicket.id}`)}</h3><strong>{formatTicketPrice(currentTicket.price)}</strong></div><p className="ticket-current">{t('landing.current')}</p></div>
      <p className="ticket-validity">{t(`landing.validity${phase}`)}</p>
      <dl className="ticket-comparison">
        {ticketPhases.map((ticket, index) => index === phase ? null : <div key={ticket.id}><dt>{t(`landing.${ticket.id}`)} <span>{t(index < phase ? 'landing.closed' : `landing.starts${index}`)}</span></dt><dd>{index < phase ? <s>{formatTicketPrice(ticket.price)}</s> : formatTicketPrice(ticket.price)}</dd></div>)}
      </dl>
      {phase < 2 && <p className="ticket-saving">{t('landing.saving', { amount: formatTicketPrice(ticketPhases[2].price - currentTicket.price), phase: t(`landing.${currentTicket.id}`) })}</p>}
      <a className="btn btn-primary ticket-buy" href="https://latiqueteracr.com/producto/festival-santos-rock-2027/" target="_blank" rel="noopener noreferrer">{t('landing.buy')}<ArrowUpRight size={19} aria-hidden="true" /><span className="sr-only"> ({t('site.newTab')})</span></a>
      <a className="ticket-sinpe" href="https://wa.me/50686896331" target="_blank" rel="noopener noreferrer">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6a12 12 0 0 0 5.8 1.5c6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.4ZM12 21.9a10 10 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.3-.4A10 10 0 1 1 12 21.9Zm5.5-7.4c-.3-.1-1.8-.9-2.1-1s-.5-.1-.7.2l-.9 1.1c-.2.2-.3.2-.6.1a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.6l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.8 1.2 3 2 3.2 5 4.5c.7.3 1.3.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4l-.6-.3Z" /></svg>
        <span>{t('landing.sinpe')}</span><strong>8689 6331</strong><ArrowUpRight size={16} aria-hidden="true" />
        <span className="sr-only"> ({t('site.newTab')})</span>
      </a>
    </div>
  </section>
}
