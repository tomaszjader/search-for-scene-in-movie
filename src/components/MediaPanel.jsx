import React from 'react'
import { Captions, Check, LoaderCircle, Play, X } from 'lucide-react'
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
  error
}) {
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
        <button className="icon-button" onClick={reset} aria-label="Usuń materiał">
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
            <b>{source.transcriptSource === 'audio' ? 'transkrypcja z audio' : `${segments.length} segmentów`}</b>
          </div>
          <Timeline
            results={results}
            duration={duration}
            activeResult={activeResult}
            playClip={playClip}
          />
        </>
      ) : (
        <button className="primary-action" onClick={transcribe} disabled={status === 'transcribing'}>
          {status === 'transcribing' ? <LoaderCircle className="spin" size={17} /> : <Captions size={17} />}
          {status === 'transcribing' ? 'Analizuję materiał…' : 'Utwórz transkrypcję'}
        </button>
      )}

      {error && <div className="error">{error}</div>}
    </aside>
  )
}
