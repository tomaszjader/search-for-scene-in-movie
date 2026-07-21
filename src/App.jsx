import React, { useRef, useState } from 'react'
import { demoData } from './data/demoData'
import { queryWords, youtubeId } from './utils/formatters'
import { Topbar } from './components/Topbar'
import { Hero } from './components/Hero'
import { SourceSelector } from './components/SourceSelector'
import { MediaPanel } from './components/MediaPanel'
import { SearchPanel } from './components/SearchPanel'
import { WorkflowFooter } from './components/WorkflowFooter'

export function App() {
  const [source, setSource] = useState(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [localUrl, setLocalUrl] = useState('')
  const [segments, setSegments] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [activeResult, setActiveResult] = useState(null)
  const [embedRange, setEmbedRange] = useState(null)

  const videoRef = useRef()
  const clipEnd = useRef(null)

  const choose = file => {
    if (!file) return
    if (localUrl) URL.revokeObjectURL(localUrl)
    setSource({ type: 'file', name: file.name, size: file.size, file })
    setLocalUrl(URL.createObjectURL(file))
    setSegments([])
    setResults([])
    setError('')
  }

  const reset = () => {
    if (localUrl) URL.revokeObjectURL(localUrl)
    setSource(null)
    setLocalUrl('')
    setYoutubeUrl('')
    setSegments([])
    setResults([])
    setQuery('')
    setError('')
    setStatus('idle')
    setEmbedRange(null)
  }

  const transcribe = () => {
    if (!source?.file) return
    setError(
      'Automatyczna transkrypcja wymaga usługi serwerowej. W wersji frontendowej możesz odtworzyć plik lub skorzystać z materiału demo.'
    )
  }

  const importYoutube = event => {
    event.preventDefault()
    if (!youtubeUrl.trim()) return
    const videoId = youtubeId(youtubeUrl)
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
      setError('Wklej prawidłowy link do filmu z YouTube.')
      return
    }
    setSource({ type: 'youtube', name: 'Film z YouTube', author: 'YouTube', duration: 0, videoId })
    setSegments([])
    setResults([])
    setEmbedRange(null)
    setStatus('ready')
    setError('')
  }

  const loadDemo = () => {
    setSource({ type: 'demo', name: 'Rozmowa z zespołem.mp4', size: 48200000 })
    setLocalUrl('')
    setSegments(demoData)
    setStatus('ready')
    setResults([])
    setError('')
  }

  const search = event => {
    event?.preventDefault()
    if (!query.trim() || !segments.length) return
    setStatus('searching')
    setError('')
    const words = queryWords(query)
    const scored = segments
      .map(segment => ({
        ...segment,
        score: words.filter(word => segment.text.toLowerCase().includes(word)).length
      }))
      .sort((a, b) => b.score - a.score)

    setResults((scored[0]?.score ? scored.filter(segment => segment.score > 0) : scored).slice(0, 3))
    setStatus('ready')

    if (!scored[0]?.score) {
      setError('Brak dokładnego dopasowania — pokazuję najbliższe fragmenty demonstracyjne.')
    }
  }

  const playClip = segment => {
    setActiveResult(segment.id)
    if (source?.type === 'youtube') {
      setEmbedRange({ start: Math.floor(segment.start), end: Math.ceil(segment.end) })
      return
    }
    if (!videoRef.current || !localUrl) return
    clipEnd.current = segment.end
    videoRef.current.currentTime = segment.start
    videoRef.current.play()
  }

  const watchClipEnd = () => {
    if (!videoRef.current || clipEnd.current === null) return
    if (videoRef.current.currentTime >= clipEnd.current) {
      videoRef.current.pause()
      clipEnd.current = null
      setActiveResult(null)
    }
  }

  const embedUrl =
    source?.type === 'youtube'
      ? `https://www.youtube.com/embed/${source.videoId}?autoplay=${embedRange ? 1 : 0}&start=${
          embedRange?.start || 0
        }${embedRange ? `&end=${embedRange.end}` : ''}&rel=0`
      : ''

  const duration = Math.max(source?.duration || 0, ...segments.map(segment => segment.end), 1)

  return (
    <div className="app-shell">
      <Topbar />
      <main>
        <Hero />

        {!source ? (
          <SourceSelector
            youtubeUrl={youtubeUrl}
            setYoutubeUrl={setYoutubeUrl}
            importYoutube={importYoutube}
            choose={choose}
            loadDemo={loadDemo}
            status={status}
            error={error}
          />
        ) : (
          <section className="workspace">
            <MediaPanel
              source={source}
              reset={reset}
              localUrl={localUrl}
              videoRef={videoRef}
              watchClipEnd={watchClipEnd}
              embedUrl={embedUrl}
              segments={segments}
              results={results}
              duration={duration}
              activeResult={activeResult}
              playClip={playClip}
              transcribe={transcribe}
              status={status}
              error={error}
            />

            <SearchPanel
              query={query}
              setQuery={setQuery}
              search={search}
              segments={segments}
              status={status}
              results={results}
              activeResult={activeResult}
              playClip={playClip}
            />
          </section>
        )}

        <WorkflowFooter />
      </main>
    </div>
  )
}
