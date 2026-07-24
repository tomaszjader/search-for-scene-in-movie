import React, { useState } from 'react'
import { Captions, Check, Download, FileText, LoaderCircle, Play, X } from 'lucide-react'
import { exportToSRT, fmt } from '../utils/formatters'
import { Timeline } from './Timeline'

export function MediaPanel({
  source,
  reset,
  localUrl,
  videoRef,
  watchClipEnd,
  embedUrl,
  segments,
  results,
  duration,
  activeResult,
  playClip,
  transcribe,
  status,
  error,
  currentTime = 0
}) {
  const [showFullTranscript, setShowFullTranscript] = useState(false)

  return (
    <aside className="media-panel panel">
      <div className="panel-heading">
        <span className="panel-index">01</span>
        <div className="file-copy">
          <strong>{source.name}</strong>
          <small>
            {source.type === 'youtube'
              ? `${source.author} · YouTube`
              : `${((source.size || 0) / 1000000).toFixed(1)} MB`}{' '}
            · {segments.length ? `${segments.length} fragmentów` : 'gotowy do analizy'}
          </small>
        </div>
        <button className="icon-button" onClick={reset} aria-label="Usuń materiał" title="Usuń plik / otwórz inny">
          <X size={16} />
        </button>
      </div>

      <div className="viewer">
        {source.type === 'youtube' ? (
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={source.name}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : localUrl ? (
          <video ref={videoRef} src={localUrl} controls onTimeUpdate={watchClipEnd} />
        ) : (
          <div className="demo-view">
            <span className="demo-play">
              <Play size={21} fill="currentColor" />
            </span>
            <strong>Materiał demonstracyjny</strong>
            <small>01:56 · rozmowa zespołu</small>
          </div>
        )}
        <div className="view-tag">SOURCE / {source.type === 'youtube' ? 'YT' : '01'}</div>
      </div>

      {segments.length ? (
        <>
          <div className="analysis-ready">
            <span>
              <Check size={13} /> Analiza gotowa
            </span>
            <div className="analysis-actions">
              <button
                type="button"
                className="subtle-btn"
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                title="Pokaż / ukryj listę wszystkich segmentów"
              >
                <FileText size={12} /> {showFullTranscript ? 'Ukryj transkrypcję' : 'Pełna transkrypcja'}
              </button>
              <button
                type="button"
                className="subtle-btn"
                onClick={() => exportToSRT(segments, source.name)}
                title="Pobierz całą transkrypcję jako plik SRT"
              >
                <Download size={12} /> SRT
              </button>
            </div>
          </div>

          <Timeline
            results={results}
            duration={duration}
            activeResult={activeResult}
            playClip={playClip}
            currentTime={currentTime}
          />

          {showFullTranscript && (
            <div className="full-transcript-box">
              <div className="transcript-box-header">
                <span>Pełny zapis rozmowy</span>
                <b>{segments.length} segmentów</b>
              </div>
              <div className="transcript-scroll">
                {segments.map((seg, idx) => (
                  <button
                    key={seg.id || idx}
                    className={`transcript-item ${activeResult === seg.id ? 'active' : ''}`}
                    onClick={() => playClip(seg)}
                  >
                    <span className="transcript-time">
                      {fmt(seg.start)}–{fmt(seg.end)}
                    </span>
                    <p>{seg.text}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <button className="primary-action" onClick={transcribe} disabled={status === 'transcribing'}>
          {status === 'transcribing' ? <LoaderCircle className="spin" size={17} /> : <Captions size={17} />}
          {status === 'transcribing' ? 'Analizuję nagranie (transkrypcja AI)...' : 'Utwórz transkrypcję nagrania'}
        </button>
      )}

      {error && <div className="error">{error}</div>}
    </aside>
  )
}

