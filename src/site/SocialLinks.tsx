import { Facebook, Instagram, Youtube } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function TikTok({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 2c.3 2.6 1.8 4.2 4.4 4.4v3.4a9 9 0 0 1-4.4-1.3v7.1a6.4 6.4 0 1 1-5.5-6.3v3.5a3 3 0 1 0 2.1 2.8V2h3.4Z" /></svg>
}

const socialLinks = [
  { name: 'Instagram', href: 'https://www.instagram.com/santosrockcr/', Icon: Instagram },
  { name: 'Facebook', href: 'https://www.facebook.com/santosrockfest/?locale=es_LA', Icon: Facebook },
  { name: 'YouTube', href: 'https://www.youtube.com/channel/UC_Tj9xdkVnwR6L4Ms3Xgrcw', Icon: Youtube },
  { name: 'TikTok', href: 'https://www.tiktok.com/@santos.rock', Icon: TikTok },
]

export default function SocialLinks({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  return <nav className={`social-links${compact ? ' social-links-compact' : ''}`} aria-label={t('site.social')}>
    {socialLinks.map(({ name, href, Icon }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} — Santos Rock (${t('site.newTab')})`} title={name}>
      <Icon size={18} aria-hidden="true" /><span>{name}</span>
    </a>)}
  </nav>
}
