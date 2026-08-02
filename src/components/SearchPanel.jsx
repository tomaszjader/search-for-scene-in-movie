import React, { useEffect, useRef, useState } from 'react'
import { Check, Clock3, Command, Copy, CornerDownLeft, Download, LoaderCircle, Play, Quote, Search, Sparkles, X } from 'lucide-react'
import { exportToSRT, fmt } from '../utils/formatters'
import { HighlightedText } from './HighlightedText'

export function SearchPanel({
  query,
  setQuery,
  search,
  segments,
  status,
  results,
  aiAnswer,
  exactQuote,
  activeResult,
  playClip,
  sourceName = 'film'
}) {
  const inputRef = useRef(null)
  const [copiedId, setCopiedId] = useState(null)

  const suggestions = [
    'Czy Piastowie byli nordami?',
    'Co badacz mówi o genetyce Słowian?',
    'Jaki jest główny wniosek?'
  ]

  useEffect(() => {
    const handleKeyDown = event => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const copyQuote = (result, e) => {
    e.stopPropagation()
    const textToCopy = `[${fmt(result.start)} - ${fmt(result.end)}] "${result.text}"`
    navigator.clipboard.writeText(textToCopy)
    setCopiedId(result.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <section className="search-panel panel">
      <div className="panel-heading search-heading">
        <span className="panel-index">02</span>
        <div>
          <strong>Znajdź moment & Odpowiedź AI</strong>
          <small>Agent AI przeczyta nagranie i odpowie na Twoje pytanie</small>
        </div>
        <div className="key" onClick={() => inputRef.current?.focus()} style={{ cursor: 'pointer' }} title="Naciśnij Ctrl+K lub Cmd+K">
          <Command size={11} /> K
        </div>
      </div>

      <form onSubmit={search} className="search-field">
        <Search size={19} />
        <input
          ref={inputRef}
          value={query}
          onChange={event => setQuery(event.target.value)}
          disabled={!segments.length}
          placeholder="np. Czy Piastowie pochodzili ze Skandynawii?"
        />
        {query && (
          <button
            type="button"
            className="clear-btn"
            onClick={() => setQuery('')}
            title="Wyczyść zapytanie"
          >
            <X size={14} />
          </button>
        )}
        <button disabled={!query.trim() || !segments.length} aria-label="Szukaj">
          {status === 'searching' ? <LoaderCircle className="spin" size={17} /> : <CornerDownLeft size={16} />}
        </button>
      </form>

      <div className="suggestions">
        <span>Podpowiedzi</span>
        {suggestions.map(item => (
          <button
            type="button"
            key={item}
            onClick={() => {
              setQuery(item)
              search(item)
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="results-area">
        {aiAnswer && (
          <div className="ai-agent-card">
            <div className="ai-agent-header">
              <span className="ai-badge">
                <Sparkles size={13} /> ASYSTENT AI FILMU (RAG)
              </span>
              {results[0] && (
                <button
                  type="button"
                  className="jump-moment-btn"
                  onClick={() => playClip(results[0])}
                >
                  <Play size={11} fill="currentColor" /> Skocz do sekundy ({fmt(results[0].start)})
                </button>
              )}
            </div>
            <div className="ai-agent-body">
              <strong>Odpowiedź na podstawie nagrania:</strong>
              <p>{aiAnswer}</p>

              {exactQuote && (
                <div className="ai-exact-quote">
                  <Quote size={12} />
                  <span>
                    <strong>Cytat z nagrania:</strong> „{exactQuote}”
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {!results.length ? (
          <div className="empty-state">
            <div className="empty-glyph">
              <Search size={20} />
            </div>
            <strong>{segments.length ? 'Materiał czeka na pytanie' : 'Najpierw przeanalizuj nagranie'}</strong>
            <p>Wpisz pytanie w języku naturalnym — Agent AI znajdzie moment i odpowie na pytanie w oparciu o cytaty.</p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <span>Powiązane fragmenty wideo</span>
              <div className="results-actions">
                <button
                  type="button"
                  className="export-link"
                  onClick={() => exportToSRT(results, `wyniki_${sourceName}`)}
                  title="Pobierz znalezione fragmenty jako plik napisów SRT"
                >
                  <Download size={12} /> SRT
                </button>
                <b>{String(results.length).padStart(2, '0')}</b>
              </div>
            </div>
            <div className="result-list">
              {results.map((result, index) => (
                <button
                  className={`result-card ${activeResult === result.id ? 'active' : ''}`}
                  key={result.id}
                  onClick={() => playClip(result)}
                >
                  <span className="result-number">0{index + 1}</span>
                  <div className="result-content">
                    <div className="result-meta">
                      <span>
                        <Clock3 size={12} /> {fmt(result.start)} — {fmt(result.end)}
                      </span>
                      <div className="result-meta-right">
                        <b>{activeResult === result.id ? 'PLAYING' : `${result.matchPercent || 95}% MATCH`}</b>
                        <span
                          className="copy-btn"
                          onClick={e => copyQuote(result, e)}
                          title="Kopiuj cytat ze znacznikiem czasu"
                        >
                          {copiedId === result.id ? <Check size={11} /> : <Copy size={11} />}
                        </span>
                      </div>
                    </div>
                    <p>
                      „<HighlightedText text={result.text} query={query} />”
                    </p>
                  </div>
                  <span className="result-play">
                    <Play size={13} fill="currentColor" />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
