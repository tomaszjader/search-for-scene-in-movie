import React, { useEffect, useRef, useState } from 'react'
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
  const [mediaDuration, setMediaDuration] = useState(0)

  const videoRef = useRef()
  const clipEnd = useRef(null)
  const transcriptionTimer = useRef(null)

  useEffect(
    () => () => {
      if (transcriptionTimer.current) clearTimeout(transcriptionTimer.current)
      if (localUrl) URL.revokeObjectURL(localUrl)
    },
    [localUrl]
  )

  const choose = file => {
    if (!file) return

    const supportedTypes = new Set([
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/webm'
    ])
    const maxFileSize = 200 * 1024 * 1024

    if (!supportedTypes.has(file.type)) {
      setError('Nieobsługiwany format. Wybierz plik MP4, WEBM, MP3 lub WAV.')
      return
    }
    if (file.size > maxFileSize) {
      setError('Plik jest za duży. Maksymalny rozmiar to 200 MB.')
      return
    }
    if (file.size === 0) {
      setError('Wybrany plik jest pusty.')
      return
    }

    if (localUrl) URL.revokeObjectURL(localUrl)
    setSource({ type: 'file', name: file.name, size: file.size, file })
    setLocalUrl(URL.createObjectURL(file))
    setSegments([])
    setResults([])
    setError('')
    setCurrentTime(0)
    setMediaDuration(0)
    setStatus('idle')
  }

  const reset = () => {
    if (transcriptionTimer.current) {
      clearTimeout(transcriptionTimer.current)
      transcriptionTimer.current = null
    }
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
    setMediaDuration(0)
  }

  const transcribe = () => {
    if (!source) return
    setStatus('transcribing')
    setError('')

    transcriptionTimer.current = setTimeout(() => {
      const durationLimit = mediaDuration || source.duration || 116
      const generated = demoData
        .filter(segment => segment.start < durationLimit)
        .map(segment => ({
          ...segment,
          end: Math.min(segment.end, durationLimit)
        }))
      setSegments(generated)
      setStatus('ready')
      transcriptionTimer.current = null
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
    setMediaDuration(120)
  }

  const loadDemo = () => {
    setSource({ type: 'demo', name: 'Rozmowa z zespołem.mp4', size: 48200000 })
    setLocalUrl('')
    setSegments(demoData)
    setStatus('ready')
    setResults([])
    setError('')
    setCurrentTime(0)
    setMediaDuration(116)
  }

  const search = eventOrQuery => {
    if (typeof eventOrQuery !== 'string') eventOrQuery?.preventDefault()
    const searchQuery = typeof eventOrQuery === 'string' ? eventOrQuery : query
    if (!searchQuery.trim() || !segments.length) return
    setStatus('searching')
    setError('')

    const words = [...new Set(queryWords(searchQuery))]
    const normalizedQuery = removeAccents(searchQuery.toLowerCase()).trim()

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

        const maxScore = 10 + words.length * 2
        return {
          ...segment,
          score,
          matchPercent: Math.round((score / maxScore) * 100)
        }
      })
      .sort((a, b) => b.score - a.score)

    const matches = scored.filter(segment => segment.score > 0)

    if (matches.length > 0) {
      setResults(matches.slice(0, 4))
    } else {
      setResults([])
      setError('Nie znaleziono fragmentów zawierających podane słowa.')
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
    mediaDuration,
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
              onLoadedMetadata={() => {
                const loadedDuration = videoRef.current?.duration
                if (Number.isFinite(loadedDuration)) setMediaDuration(loadedDuration)
              }}
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
