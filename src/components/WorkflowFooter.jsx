import React from 'react'
import { useI18n } from '../i18n'

export function WorkflowFooter() {
  const { t } = useI18n()
  return (
    <>
      <section className="workflow" id="workflow">
        <span className="workflow-label">{t('how')}</span>
        <div className="workflow-items">
          <div>
            <b>01</b>
            <span>
              <strong>{t('workflow1')}</strong><small>{t('workflow1s')}</small>
            </span>
          </div>
          <div>
            <b>02</b>
            <span>
              <strong>{t('workflow2')}</strong><small>{t('workflow2s')}</small>
            </span>
          </div>
          <div>
            <b>03</b>
            <span>
              <strong>{t('workflow3')}</strong><small>{t('workflow3s')}</small>
            </span>
          </div>
        </div>
      </section>

      <footer>
        <span>© 2026 FRAMEFINDER</span>
        <p>{t('privacy')}</p>
        <span>PL / EN</span>
      </footer>
    </>
  )
}
