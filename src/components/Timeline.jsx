import React from 'react'
import { fmt } from '../utils/formatters'

export function Timeline({ results, duration, activeResult, playClip }) {
  if (!results.length) return null

  return (
    <div className="result-timeline" aria-label="Znalezione fragmenty na osi czasu">
      <div className="timeline-label">
        <span>Znalezione fragmenty</span>
        <b>{fmt(duration)}</b>
      </div>
      <div className="timeline-track">
        {results.map((result, index) => (
          <button
            key={result.id}
            className={`timeline-hit ${activeResult === result.id ? 'active' : ''}`}
            style={{
              left: `${(result.start / duration) * 100}%`,
              width: `${Math.max(((result.end - result.start) / duration) * 100, 2.5)}%`
            }}
            onClick={() => playClip(result)}
            title={`Wynik ${index + 1}: ${fmt(result.start)}–${fmt(result.end)}`}
          >
            <span>{index + 1}</span>
          </button>
        ))}
      </div>
      <div className="timeline-scale">
        <span>00:00</span>
        <span>{fmt(duration / 2)}</span>
        <span>{fmt(duration)}</span>
      </div>
    </div>
  )
}
