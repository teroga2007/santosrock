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
      <p className="ticket-sinpe">{t('landing.sinpe')} <strong>8689 6331</strong></p>
    </div>
  </section>
}
