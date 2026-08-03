import React from 'react'
import { Sparkles } from 'lucide-react'
import { useI18n } from '../i18n'

export function Hero() {
  const { t } = useI18n()
  return (
    <section className="hero">
      <div className="hero-kicker">
        <Sparkles size={13} /> {t('kicker')}
      </div>
      <h1>
        {t('hero1')}<br />
        <em>{t('hero2')}</em>
      </h1>
      <p>
        {t('heroText')}
      </p>
      <div className="hero-meta">
        <span>{t('youtubeFiles')}</span><span>{t('natural')}</span><span>{t('precision')}</span>
      </div>
    </section>
  )
}
