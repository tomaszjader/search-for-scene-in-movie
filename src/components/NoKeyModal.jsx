import React from 'react'
import { Key, Play, Sparkles, X } from 'lucide-react'
import { useI18n } from '../i18n'

export function NoKeyModal({ isOpen, onClose, onOpenSettings, onUseDemo }) {
  const { t } = useI18n()
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
              <h3>{t('noKeyTitle')}</h3><small>{t('browserAnalysis')}</small>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={t('close')}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p className="notice-text">
            {t('noKeyText')}
          </p>

          <div className="notice-options">
            <div className="option-card primary">
              <div className="option-head">
                <Sparkles size={18} />
                <strong>{t('optionDemo')}</strong>
              </div>
              <p>
                {t('optionDemoText')}
              </p>
              <button
                type="button"
                className="action-btn-demo"
                onClick={() => {
                  onUseDemo()
                  onClose()
                }}
              >
                <Play size={13} fill="currentColor" /> {t('tryDemo')}
              </button>
            </div>

            <div className="option-card secondary">
              <div className="option-head">
                <Key size={18} />
                <strong>{t('optionKey')}</strong>
              </div>
              <p>
                {t('optionKeyText')}
              </p>
              <button
                type="button"
                className="action-btn-key"
                onClick={() => {
                  onClose()
                  onOpenSettings()
                }}
              >
                <Key size={13} /> {t('configure')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
