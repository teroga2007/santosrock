import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
const eventTime = new Date('2027-01-16T00:00:00-06:00').getTime()

export default function Countdown() {
  const { t } = useTranslation()
  const [now, setNow] = useState(Date.now)
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  const seconds = Math.max(0, Math.floor((eventTime - now) / 1000))
  const values = [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60]
  return <section className="countdown-panel" aria-label={t('countdown.label')}><div className="countdown-label"><span className="live-dot" />{seconds === 0 ? t('countdown.ready') : t('countdown.label')}</div><div className="timer" role="timer">{values.map((value, index) => <div className="time-unit" key={index}><strong>{String(value).padStart(2, '0')}</strong><span>{t(`countdown.${['days', 'hours', 'minutes', 'seconds'][index]}`)}</span></div>)}</div><div className="countdown-date"><span>16 / 01 / 2027</span><ArrowUpRight size={27} /></div></section>
}

