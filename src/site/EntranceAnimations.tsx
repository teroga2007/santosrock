import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function EntranceAnimations() {
  const { pathname } = useLocation()
  const { i18n } = useTranslation()
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches || !('IntersectionObserver' in window)) return
    const animations = new Set<Animation>()
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        observer.unobserve(entry.target)
        if (preference.matches) continue
        const animation = entry.target.animate([
          { opacity: .25, transform: 'translateY(16px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 550, easing: 'cubic-bezier(.2,.65,.3,1)' })
        animations.add(animation)
        animation.onfinish = () => animations.delete(animation)
      }
    }, { threshold: .08 })
    document.querySelectorAll('.original-hero-copy, .original-page-heading>div, .migrated-section, .home-notes>h2, .home-notes-grid article, .newsletter-section, .blog-card').forEach(node => observer.observe(node))
    const cancel = () => { if (preference.matches) animations.forEach(animation => animation.cancel()) }
    preference.addEventListener('change', cancel)
    return () => { observer.disconnect(); animations.forEach(animation => animation.cancel()); preference.removeEventListener('change', cancel) }
  }, [pathname, i18n.language])
  return null
}
