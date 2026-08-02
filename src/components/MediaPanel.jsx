import React, { useEffect, useRef, useState } from 'react'
import { Captions, Check, Download, FileText, Key, LoaderCircle, Play, Upload, X } from 'lucide-react'
import { exportToSRT, fmt, parseSRT } from '../utils/formatters'
import { Timeline } from './Timeline'

export function MediaPanel({
  source,
  reset,
  localUrl,
  videoRef,
  watchClipEnd,
  onLoadedMetadata,
  embedUrl,
  segments,
  results,
  duration,
  activeResult,
  playClip,
  transcribe,
  status,
  transcriptionProgress,
  error,
  currentTime = 0,
  apiKey,
  apiProvider,
  onOpenApiModal,
  onDurationDiscovered,
  onCustomSegmentsImport
}) {
  const [showFullTranscript, setShowFullTranscript] = useState(false)
  const srtInputRef = useRef(null)

  const providerName =
    apiProvider === 'local' ? 'Lokalny Whisper' : apiProvider === 'gemini' ? 'Google Gemini' : apiProvider === 'groq' ? 'Groq Cloud' : 'OpenAI'

  useEffect(() => {
    const handleMessage = event => {
      if (event.origin.includes('youtube.com')) {
        try {
          const data = JSON.parse(event.data)
          if (data?.info?.duration && onDurationDiscovered) {
            onDurationDiscovered(data.info.duration)
          }
        } catch (e) {}
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onDurationDiscovered])

  const handleSrtUpload = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = event => {
      const text = event.target.result
      const parsed = parseSRT(text)
      if (parsed && parsed.length > 0 && onCustomSegmentsImport) {
        onCustomSegmentsImport(parsed)
      }
    }
    reader.readAsText(file)
  }

  const iframeSrc = embedUrl
    ? embedUrl.includes('enablejsapi=1')
      ? embedUrl
      : `${embedUrl}&enablejsapi=1`
    : ''

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
            · {segments.length ? `${segments.length} wypowiedzi` : 'gotowy do analizy'}
          </small>
        </div>
        <button className="icon-button" onClick={reset} aria-label="Usuń materiał" title="Usuń plik / otwórz inny">
          <X size={16} />
        </button>
      </div>

      <div className="viewer">
        {source.type === 'youtube' ? (
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title={source.name}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : localUrl ? (
          <video
            ref={videoRef}
            src={localUrl}
            controls
            onLoadedMetadata={onLoadedMetadata}
            onTimeUpdate={watchClipEnd}
          />
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

      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,.vtt,.txt"
        hidden
        onChange={handleSrtUpload}
      />

      {segments.length ? (
        <>
          <div className="analysis-ready">
            <span>
              <Check size={13} /> Wczytano {segments.length} wypowiedzi
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
                <b>{segments.length} wypowiedzi</b>
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
        <>
          <button className="primary-action" onClick={transcribe} disabled={status === 'transcribing'}>
            {status === 'transcribing' ? <LoaderCircle className="spin" size={17} /> : <Captions size={17} />}
            {status === 'transcribing'
              ? transcriptionProgress || `Generuję transkrypcję (${providerName})...`
              : apiKey || apiProvider === 'local'
              ? `Uruchom transkrypcję (${providerName})`
              : 'Uruchom transkrypcję'}
          </button>
          <div className="media-extra-actions">
            <button
              type="button"
              className="subtle-btn"
              onClick={() => srtInputRef.current?.click()}
            >
              <Upload size={12} /> Wgraj własny plik napisów (SRT / VTT)
            </button>
          </div>
          <p className="demo-notice">
            {apiKey || apiProvider === 'local' ? (
              <span>Używasz klucza API: <strong>{providerName}</strong></span>
            ) : (
              <span>
                Wymagany klucz API do pełnej analizy nagrania. <button type="button" className="text-inline-link" onClick={onOpenApiModal}>Skonfiguruj klucz API</button>
              </span>
            )}
          </p>
        </>
      )}

      {error && <div className="error">{error}</div>}
    </aside>
  )
}
