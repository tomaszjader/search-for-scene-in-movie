import React from 'react'
import { ArrowUpRight, Key, Play } from 'lucide-react'
import { useI18n } from '../i18n'

export function Topbar({ apiKey, apiProvider, onOpenApiModal }) {
  const { language, setLanguage, t } = useI18n()
  const providerName =
    apiProvider === 'local' ? 'Lokalny Whisper' : apiProvider === 'gemini' ? 'Gemini' : apiProvider === 'groq' ? 'Groq' : 'OpenAI'

  return (
    <header className="topbar">
      <a className="brand" href="#">
        <span className="brand-mark">
          <Play size={12} fill="currentColor" />
        </span>
        <span>framefinder</span>
      </a>
      <div className="top-status">
        <i /> {t('desktopApp')} <span>v2.0</span>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className={`api-status-badge ${apiKey || apiProvider === 'local' ? 'active' : 'demo'}`}
          onClick={onOpenApiModal}
          title={t('apiSettings')}
        >
          <Key size={13} />
          <span>{apiProvider === 'local' ? providerName : apiKey ? `API: ${providerName}` : t('noKey')}</span>
        </button>
        <div className="language-switch" aria-label="Language">
          <button className={language === 'pl' ? 'active' : ''} onClick={() => setLanguage('pl')}>PL</button>
          <button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
          <button className={language === 'de' ? 'active' : ''} onClick={() => setLanguage('de')}>DE</button>
          <button className={language === 'es' ? 'active' : ''} onClick={() => setLanguage('es')}>ES</button>
          <button className={language === 'ru' ? 'active' : ''} onClick={() => setLanguage('ru')}>RU</button>
        </div>
        <a className="how-link" href="#workflow">
          {t('how')} <ArrowUpRight size={14} />
        </a>
      </div>
    </header>
  )
}
