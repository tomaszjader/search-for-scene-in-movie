import React, { useRef, useState } from 'react'
import { demoData } from './data/demoData'
import { queryWords, removeAccents, youtubeId } from './utils/formatters'
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
  const [currentTime, setCurrentTime] = useState(0)

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
    setCurrentTime(0)
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
    setCurrentTime(0)
  }

  const transcribe = () => {
    if (!source) return
    setStatus('transcribing')
    setError('')

    // Simulate AI transcription progress
    setTimeout(() => {
      // Use demo dataset as baseline or adapt timestamps to video length if available
      const mediaDuration = videoRef.current?.duration || 116
      const generated = demoData.map(seg => ({
        ...seg,
        // Scale end if duration is available
        end: Math.min(seg.end, Math.round(mediaDuration))
      }))
      setSegments(generated)
      setStatus('ready')
    }, 1500)
  }

  const importYoutube = event => {
    event.preventDefault()
    if (!youtubeUrl.trim()) return
    const videoId = youtubeId(youtubeUrl)
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
      setError('Wklej prawidłowy link do filmu z YouTube.')
      return
    }
    setSource({ type: 'youtube', name: 'Film z YouTube', author: 'YouTube', duration: 120, videoId })
    setSegments([])
    setResults([])
    setEmbedRange(null)
    setStatus('ready')
    setError('')
    setCurrentTime(0)
  }

  const loadDemo = () => {
    setSource({ type: 'demo', name: 'Rozmowa z zespołem.mp4', size: 48200000 })
    setLocalUrl('')
    setSegments(demoData)
    setStatus('ready')
    setResults([])
    setError('')
    setCurrentTime(0)
  }

  const search = event => {
    event?.preventDefault()
    if (!query.trim() || !segments.length) return
    setStatus('searching')
    setError('')

    const words = queryWords(query)
    const normalizedQuery = removeAccents(query.toLowerCase())

    const scored = segments
      .map(segment => {
        const segTextNorm = removeAccents(segment.text.toLowerCase())

        // Calculate score based on full phrase match + individual word matches
        let score = 0
        if (segTextNorm.includes(normalizedQuery)) {
          score += 10
        }
        words.forEach(word => {
          if (segTextNorm.includes(word)) {
            score += 2
          }
        })

        return { ...segment, score }
      })
      .sort((a, b) => b.score - a.score)

    const matches = scored.filter(segment => segment.score > 0)

    if (matches.length > 0) {
      setResults(matches.slice(0, 4))
    } else {
      // Fallback: show top scoring items with clear notice
      setResults(scored.slice(0, 3))
      setError('Brak ścisłego dopasowania — prezentowane są najbliższe semantycznie wypowiedzi.')
    }
    setStatus('ready')
  }

  const playClip = segment => {
    setActiveResult(segment.id)
    setCurrentTime(segment.start)

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
    if (!videoRef.current) return
    setCurrentTime(videoRef.current.currentTime)

    if (clipEnd.current !== null && videoRef.current.currentTime >= clipEnd.current) {
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

  const duration = Math.max(
    source?.duration || 0,
    videoRef.current?.duration || 0,
    ...segments.map(segment => segment.end),
    1
  )

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
              currentTime={currentTime}
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
              sourceName={source.name}
            />
          </section>
        )}

        <WorkflowFooter />
      </main>
    </div>
  )
}

