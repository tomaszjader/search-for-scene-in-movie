import React, { useState } from 'react'
import { Check, Eye, EyeOff, Key, LoaderCircle, ShieldCheck, Sparkles, X } from 'lucide-react'
import { validateApiKey } from '../utils/youtubeTranscripts'

export const PROVIDERS = [
  {
    id: 'local',
    name: 'Lokalnie',
    model: 'Whisper Small',
    desc: 'Bez klucza i bez wysyłania audio. Model pobiera się przy pierwszym użyciu.',
    placeholder: ''
  },
  {
    id: 'openai',
    name: 'OpenAI',
    model: 'Whisper & GPT-4o API',
    desc: 'Transkrypcja nagrań audio/wideo oraz generowanie fragmentów.',
    placeholder: 'sk-proj-...'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    model: 'Gemini 1.5 Pro / Flash',
    desc: 'Natywna analiza i podsumowanie treści z czasem.',
    placeholder: 'AIzaSy...'
  },
  {
    id: 'groq',
    name: 'Groq Cloud',
    model: 'Whisper Large v3',
    desc: 'Błyskawiczna transkrypcja z darmowym limitem zapytań.',
    placeholder: 'gsk_...'
  }
]

export function ApiKeyModal({
  isOpen,
  onClose,
  apiKey,
  apiProvider,
  onSaveKey,
  onClearKey,
  onSwitchToDemo
}) {
  const [tempKey, setTempKey] = useState(apiKey || '')
  const [tempProvider, setTempProvider] = useState(apiProvider || 'openai')
  const [showKeyText, setShowKeyText] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // { success: boolean, message: string }

  if (!isOpen) return null

  const handleTestAndSave = async e => {
    if (e) e.preventDefault()
    if (tempProvider !== 'local' && !tempKey.trim()) return

    setIsTesting(true)
    setTestResult(null)

    try {
      if (tempProvider !== 'local') await validateApiKey(tempKey, tempProvider)
      setTestResult({
        success: true,
        message: tempProvider === 'local'
          ? 'Wybrano lokalną transkrypcję Whisper.'
          : `Klucz ${tempProvider.toUpperCase()} jest aktywny i poprawny!`
      })
      onSaveKey(tempKey.trim(), tempProvider)

      setTimeout(() => {
        setIsTesting(false)
        onClose()
      }, 1000)
    } catch (err) {
      setIsTesting(false)
      setTestResult({
        success: false,
        message: err.message || 'Wystąpił błąd podczas weryfikacji klucza API.'
      })
    }
  }

  const handleClear = () => {
    setTempKey('')
    setTestResult(null)
    onClearKey()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">
              <Key size={18} />
            </span>
            <div>
              <h3>Ustawienia Klucza API</h3>
              <small>Bring Your Own Key (BYOK)</small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Zamknij">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="provider-selector-label">Wybierz dostawcę AI / Transkrypcji:</div>

          <div className="provider-grid">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                type="button"
                className={`provider-card ${tempProvider === p.id ? 'active' : ''}`}
                onClick={() => {
                  setTempProvider(p.id)
                  setTestResult(null)
                }}
              >
                <div className="provider-card-head">
                  <strong>{p.name}</strong>
                  <span className="provider-model">{p.model}</span>
                </div>
                <p>{p.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleTestAndSave} className="api-key-form">
            {tempProvider !== 'local' && <label htmlFor="api-key-input">
              Klucz API ({PROVIDERS.find(p => p.id === tempProvider)?.name}):
            </label>}
            {tempProvider !== 'local' && <div className="input-password-wrapper">
              <input
                id="api-key-input"
                type={showKeyText ? 'text' : 'password'}
                value={tempKey}
                onChange={e => {
                  setTempKey(e.target.value)
                  setTestResult(null)
                }}
                placeholder={PROVIDERS.find(p => p.id === tempProvider)?.placeholder}
                autoComplete="off"
              />
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowKeyText(!showKeyText)}
                title={showKeyText ? 'Ukryj klucz' : 'Pokaż klucz'}
              >
                {showKeyText ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>}

            {testResult && (
              <div className={`test-result-banner ${testResult.success ? 'success' : 'error'}`}>
                {testResult.success ? <Check size={16} /> : <X size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="security-note">
              <ShieldCheck size={16} />
              <span>
                Twój klucz jest zapisywany <strong>wyłącznie w Twojej przeglądarce (`localStorage`)</strong>. Nigdy nie jest przesyłany na żaden serwer pośredniczący.
              </span>
            </div>

            <div className="modal-actions">
              {apiKey ? (
                <button type="button" className="danger-btn" onClick={handleClear}>
                  Usuń klucz
                </button>
              ) : (
                <button
                  type="button"
                  className="subtle-btn"
                  onClick={() => {
                    onSwitchToDemo()
                    onClose()
                  }}
                >
                  <Sparkles size={14} /> Używaj trybu Demo
                </button>
              )}

              <button type="submit" className="primary-action-btn" disabled={(tempProvider !== 'local' && !tempKey.trim()) || isTesting}>
                {isTesting ? (
                  <>
                    <LoaderCircle className="spin" size={16} /> Testuję klucz...
                  </>
                ) : testResult?.success ? (
                  <>
                    <Check size={16} /> Zapisano!
                  </>
                ) : (
                  tempProvider === 'local' ? 'Wybierz transkrypcję lokalną' : 'Testuj i zapisz klucz API'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
