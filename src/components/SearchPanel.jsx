import React from 'react'
import { Clock3, Command, CornerDownLeft, LoaderCircle, Play, Search } from 'lucide-react'
import { fmt } from '../utils/formatters'
import { HighlightedText } from './HighlightedText'

export function SearchPanel({
  query,
  setQuery,
  search,
  segments,
  status,
  results,
  activeResult,
  playClip
}) {
  const suggestions = [
    'Co było najtrudniejsze?',
    'Jaki jest główny wniosek?',
    'Jakie są plany?'
  ]

  return (
    <section className="search-panel panel">
      <div className="panel-heading search-heading">
        <span className="panel-index">02</span>
        <div>
          <strong>Znajdź moment</strong>
          <small>Opisz scenę, wypowiedź lub emocję</small>
        </div>
        <div className="key">
          <Command size={11} /> K
        </div>
      </div>

      <form onSubmit={search} className="search-field">
        <Search size={19} />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          disabled={!segments.length}
          placeholder="Gdzie rozmówca mówi o zmianie produktu?"
        />
        <button disabled={!query.trim() || !segments.length} aria-label="Szukaj">
          {status === 'searching' ? <LoaderCircle className="spin" size={17} /> : <CornerDownLeft size={16} />}
        </button>
      </form>

      <div className="suggestions">
        <span>Podpowiedzi</span>
        {suggestions.map(item => (
          <button key={item} onClick={() => setQuery(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="results-area">
        {!results.length ? (
          <div className="empty-state">
            <div className="empty-glyph">
              <Search size={20} />
            </div>
            <strong>{segments.length ? 'Materiał czeka na pytanie' : 'Najpierw przeanalizuj nagranie'}</strong>
            <p>Każdy wynik otrzyma dokładny timestamp i cytat z transkrypcji.</p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <span>Najlepsze dopasowania</span>
              <b>{String(results.length).padStart(2, '0')}</b>
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
                      <b>{activeResult === result.id ? 'PLAYING' : `${Math.max(78, 96 - index * 7)}% MATCH`}</b>
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
