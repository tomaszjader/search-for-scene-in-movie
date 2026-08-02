import React from 'react'
import { Key, Play, Sparkles, X } from 'lucide-react'

export function NoKeyModal({ isOpen, onClose, onOpenSettings, onUseDemo }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-notice" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon warning">
              <Key size={18} />
            </span>
            <div>
              <h3>Brak skonfigurowanego klucza API</h3>
              <small>Przeglądarkowa analiza wideo / audio</small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Zamknij">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="notice-text">
            Nie dodałeś jeszcze swojego klucza API (OpenAI, Gemini lub Groq). Ponieważ projekt działa w całości w przeglądarce, możesz skorzystać z dwóch opcji:
          </p>

          <div className="notice-options">
            <div className="option-card primary">
              <div className="option-head">
                <Sparkles size={18} />
                <strong>Opcja 1: Przełącz w tryb Demo (Zalecane)</strong>
              </div>
              <p>
                Użyj wbudowanych danych demonstracyjnych. Przeprowadzisz pełne wyszukiwanie tekstowe, przetestujesz interaktywne znacznik czasu i sprawdzisz eksport plików SRT w 5 sekund.
              </p>
              <button
                type="button"
                className="action-btn-demo"
                onClick={() => {
                  onUseDemo()
                  onClose()
                }}
              >
                <Play size={13} fill="currentColor" /> Wypróbuj w trybie Demo
              </button>
            </div>

            <div className="option-card secondary">
              <div className="option-head">
                <Key size={18} />
                <strong>Opcja 2: Podaj swój klucz API</strong>
              </div>
              <p>
                Dodaj swój klucz API z OpenAI (Whisper), Google Gemini lub Groq Cloud. Klucz zostanie zapisany w 100% lokalnie w Twojej przeglądarce (`localStorage`).
              </p>
              <button
                type="button"
                className="action-btn-key"
                onClick={() => {
                  onClose()
                  onOpenSettings()
                }}
              >
                <Key size={13} /> Skonfiguruj klucz API
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
