import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Mail } from 'lucide-react'

export default function Newsletter() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending') return
    const form = event.currentTarget
    const body = new URLSearchParams()
    new FormData(form).forEach((value, key) => body.append(key, String(value)))
    setStatus('sending')
    try {
      const response = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() })
      if (!response.ok) throw new Error('Subscription failed')
      setStatus('success')
      form.reset()
    } catch { setStatus('error') }
  }
  return <section className="newsletter-section">
    <div className="newsletter-copy"><Mail size={36} strokeWidth={1.3} /><h2>{t('newsletter.title')}</h2><p>{t('newsletter.description')}</p></div>
    <form className="newsletter-form" name="newsletter" method="POST" data-netlify="true" data-netlify-honeypot="bot-field" onSubmit={submit}>
      <input type="hidden" name="form-name" value="newsletter" />
      <input type="hidden" name="language" value={i18n.language} />
      <p className="newsletter-trap" aria-hidden="true"><label>Leave empty<input name="bot-field" tabIndex={-1} autoComplete="off" /></label></p>
      <label htmlFor="newsletter-email">{t('newsletter.email')}</label>
      <input className="input" id="newsletter-email" type="email" name="email" autoComplete="email" required maxLength={254} placeholder={t('newsletter.placeholder')} disabled={status === 'sending' || status === 'success'} />
      <label className="newsletter-consent"><input type="checkbox" className="checkbox checkbox-sm" name="consent" value="yes" required disabled={status === 'sending' || status === 'success'} /><span>{t('newsletter.consent')}</span></label>
      <button className="btn btn-primary" type="submit" disabled={status === 'sending' || status === 'success'}>{t(status === 'sending' ? 'newsletter.sending' : 'newsletter.submit')}<ArrowUpRight size={18} /></button>
      <p className="newsletter-feedback" role={status === 'error' ? 'alert' : 'status'}>{status === 'success' ? t('newsletter.success') : status === 'error' ? t('newsletter.error') : ''}</p>
    </form>
  </section>
}
