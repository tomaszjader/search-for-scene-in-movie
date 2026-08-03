import React from 'react'
import { fmt } from '../utils/formatters'
import { useI18n } from '../i18n'

export function Timeline({ results, duration, activeResult, playClip, currentTime = 0 }) {
  const { t } = useI18n()
  if (!results.length && !duration) return null

  const validDuration = Math.max(duration || 1, 1)
  const progressPercent = Math.min(100, Math.max(0, ((currentTime || 0) / validDuration) * 100))

  return (
    <div className="result-timeline" aria-label={t('timeline')}>
      <div className="timeline-label">
        <span>{t('timeline')} ({results.length})</span>
        <b>
          {fmt(currentTime)} / {fmt(validDuration)}
        </b>
      </div>
      <div className="timeline-track">
        {results.map((result, index) => (
          <button
            key={result.id}
            className={`timeline-hit ${activeResult === result.id ? 'active' : ''}`}
            style={{
              left: `${(result.start / validDuration) * 100}%`,
              width: `${Math.max(((result.end - result.start) / validDuration) * 100, 2.5)}%`
            }}
            onClick={() => playClip(result)}
            title={`${t('result')} ${index + 1}: ${fmt(result.start)}–${fmt(result.end)}`}
          >
            <span>{index + 1}</span>
          </button>
        ))}
        {currentTime > 0 && (
          <div
            className="timeline-playhead"
            style={{ left: `${progressPercent}%` }}
            title={`${t('playback')}: ${fmt(currentTime)}`}
          />
        )}
      </div>
      <div className="timeline-scale">
        <span>00:00</span>
        <span>{fmt(validDuration / 2)}</span>
        <span>{fmt(validDuration)}</span>
      </div>
    </div>
  )
}
