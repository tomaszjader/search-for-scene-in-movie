import React from 'react'
import { ArrowUpRight, Key, Play } from 'lucide-react'

export function Topbar({ apiKey, apiProvider, onOpenApiModal }) {
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
        <i /> Aplikacja desktopowa <span>v2.0</span>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className={`api-status-badge ${apiKey || apiProvider === 'local' ? 'active' : 'demo'}`}
          onClick={onOpenApiModal}
          title="Ustawienia klucza API (BYOK)"
        >
          <Key size={13} />
          <span>{apiProvider === 'local' ? providerName : apiKey ? `API: ${providerName}` : 'Brak klucza API (Demo)'}</span>
        </button>
        <a className="how-link" href="#workflow">
          Jak to działa <ArrowUpRight size={14} />
        </a>
      </div>
    </header>
  )
}
