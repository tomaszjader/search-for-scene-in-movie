import React, { useEffect, useRef, useState } from 'react'
import { demoData } from './data/demoData'
import { queryWords, removeAccents, youtubeId } from './utils/formatters'
import {
  fetchYoutubeCaptions,
  performAiSemanticSearch,
  transcribeWithGemini,
  transcribeWithOpenAI,
  transcribeYoutubeWithOpenAI
} from './utils/youtubeTranscripts'
import { Topbar } from './components/Topbar'
import { Hero } from './components/Hero'
import { SourceSelector } from './components/SourceSelector'
import { MediaPanel } from './components/MediaPanel'
import { SearchPanel } from './components/SearchPanel'
import { WorkflowFooter } from './components/WorkflowFooter'
import { ApiKeyModal } from './components/ApiKeyModal'
import { NoKeyModal } from './components/NoKeyModal'
import { useI18n } from './i18n'

export function App() {
  const { language } = useI18n()
  const msg = (pl, en, de = en) => language === 'pl' ? pl : language === 'de' ? de : en
  const [source, setSource] = useState(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [localUrl, setLocalUrl] = useState('')
  const [segments, setSegments] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [aiAnswer, setAiAnswer] = useState('')
  const [exactQuote, setExactQuote] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [activeResult, setActiveResult] = useState(null)
  const [embedRange, setEmbedRange] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(0)
  const [transcriptionProgress, setTranscriptionProgress] = useState('')

  // API Key State
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('framefinder_api_key') || '')
  const [apiProvider, setApiProvider] = useState(
    () => localStorage.getItem('framefinder_api_provider') || 'openai'
  )
  const [isApiModalOpen, setIsApiModalOpen] = useState(false)
  const [isNoKeyModalOpen, setIsNoKeyModalOpen] = useState(false)

  const videoRef = useRef()
  const clipEnd = useRef(null)

  useEffect(
    () => () => {
      if (localUrl) URL.revokeObjectURL(localUrl)
    },
    [localUrl]
  )

  useEffect(() => {
    const desktop = window.frameFinderDesktop
    if (!desktop?.onTranscriptionProgress) return undefined
    return desktop.onTranscriptionProgress(progress => {
      if (progress?.message) setTranscriptionProgress(progress.message)
    })
  }, [])

  const handleSaveApiKey = (key, provider) => {
    setApiKey(key)
    setApiProvider(provider)
    localStorage.setItem('framefinder_api_key', key)
    localStorage.setItem('framefinder_api_provider', provider)
  }

  const handleClearApiKey = () => {
    setApiKey('')
    localStorage.removeItem('framefinder_api_key')
  }

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
      setError(msg('Nieobsługiwany format. Wybierz plik MP4, WEBM, MP3 lub WAV.', 'Unsupported format. Choose an MP4, WEBM, MP3, or WAV file.', 'Nicht unterstütztes Format. Wähle eine MP4-, WEBM-, MP3- oder WAV-Datei.'))
      return
    }
    if (file.size > maxFileSize) {
      setError(msg('Plik jest za duży. Maksymalny rozmiar to 200 MB.', 'The file is too large. Maximum size is 200 MB.', 'Die Datei ist zu groß. Die maximale Größe beträgt 200 MB.'))
      return
    }
    if (file.size === 0) {
      setError(msg('Wybrany plik jest pusty.', 'The selected file is empty.', 'Die ausgewählte Datei ist leer.'))
      return
    }

    if (localUrl) URL.revokeObjectURL(localUrl)
    setSource({ type: 'file', name: file.name, size: file.size, file })
    setLocalUrl(URL.createObjectURL(file))
    setSegments([])
    setResults([])
    setAiAnswer('')
    setExactQuote('')
    setError('')
    setCurrentTime(0)
    setMediaDuration(0)
    setStatus('idle')
  }

  const reset = () => {
    if (localUrl) URL.revokeObjectURL(localUrl)
    setSource(null)
    setLocalUrl('')
    setYoutubeUrl('')
    setSegments([])
    setResults([])
    setAiAnswer('')
    setExactQuote('')
    setQuery('')
    setError('')
    setStatus('idle')
    setEmbedRange(null)
    setCurrentTime(0)
    setMediaDuration(0)
  }

  const transcribe = async () => {
    if (!source) return

    if (!apiKey && apiProvider !== 'local') {
      setIsNoKeyModalOpen(true)
      return
    }

    setStatus('transcribing')
    setError('')

    if (source.type === 'youtube' && window.frameFinderDesktop?.transcribeYouTube) {
      try {
        setTranscriptionProgress(msg('Rozpoczynam transkrypcję…', 'Starting transcription…', 'Transkription wird gestartet…'))
        const result = await window.frameFinderDesktop.transcribeYouTube({
          url: `https://www.youtube.com/watch?v=${source.videoId}`,
          apiKey,
          provider: apiProvider
        })
        if (result?.segments?.length) {
          setSegments(result.segments)
          const lastSeg = result.segments[result.segments.length - 1]
          if (lastSeg?.end) setMediaDuration(lastSeg.end)
          setStatus('ready')
          setTranscriptionProgress('')
          return
        }
      } catch (err) {
        setError(`${msg('Błąd transkrypcji Electron', 'Electron transcription error')}: ${err.message}`)
        setStatus('ready')
        setTranscriptionProgress('')
        return
      }
    }

    // 1. Uploaded local file with OpenAI API Key -> Call Whisper
    if (source.file && apiKey && apiProvider === 'openai') {
      try {
        const whisperSegments = await transcribeWithOpenAI(source.file, apiKey)
        if (whisperSegments && whisperSegments.length > 0) {
          setSegments(whisperSegments)
          const lastSeg = whisperSegments[whisperSegments.length - 1]
          if (lastSeg?.end) setMediaDuration(lastSeg.end)
          setStatus('ready')
          return
        }
      } catch (err) {
        console.warn('Whisper API error:', err)
        setError(`${msg('Błąd Whisper API', 'Whisper API error')}: ${err.message}`)
        setStatus('ready')
        return
      }
    }

    // 2. YouTube video or text source with OpenAI API Key
    if (apiKey && apiProvider === 'openai') {
      try {
        const targetDur = mediaDuration || source.duration || 3229
        const aiSegments = await transcribeYoutubeWithOpenAI(source.name || 'Film', apiKey, targetDur)
        if (aiSegments && aiSegments.length > 0) {
          setSegments(aiSegments)
          const lastSeg = aiSegments[aiSegments.length - 1]
          if (lastSeg?.end) setMediaDuration(lastSeg.end)
          setStatus('ready')
          return
        }
      } catch (err) {
        console.warn('OpenAI API error:', err)
        setError(`${msg('Błąd OpenAI API', 'OpenAI API error')}: ${err.message}`)
        setStatus('ready')
        return
      }
    }

    // 3. Gemini API
    if (apiKey && apiProvider === 'gemini') {
      try {
        const geminiSegments = await transcribeWithGemini(source.name, apiKey)
        if (geminiSegments && geminiSegments.length > 0) {
          setSegments(geminiSegments)
          const lastSeg = geminiSegments[geminiSegments.length - 1]
          if (lastSeg?.end) setMediaDuration(lastSeg.end)
          setStatus('ready')
          return
        }
      } catch (err) {
        console.warn('Gemini API error:', err)
        setError(`${msg('Błąd Gemini API', 'Gemini API error')}: ${err.message}`)
        setStatus('ready')
        return
      }
    }

    setError(msg('Aby wygenerować transkrypcję AI, dodaj swój klucz API w ustawieniach.', 'Add your API key in settings to generate an AI transcript.', 'Füge deinen API-Schlüssel in den Einstellungen hinzu, um ein KI-Transkript zu erstellen.'))
    setStatus('ready')
  }

  const importYoutube = async event => {
    event.preventDefault()
    if (!youtubeUrl.trim()) return
    const videoId = youtubeId(youtubeUrl)
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
      setError(msg('Wklej prawidłowy link do filmu z YouTube.', 'Paste a valid YouTube video link.', 'Füge einen gültigen YouTube-Videolink ein.'))
      return
    }

    setSource({ type: 'youtube', name: msg('Film z YouTube', 'YouTube video', 'YouTube-Video'), author: 'YouTube', videoId })
    setSegments([])
    setResults([])
    setAiAnswer('')
    setExactQuote('')
    setEmbedRange(null)
    setStatus('transcribing')
    setError('')
    setCurrentTime(0)

    try {
      // Fetch full-length YouTube captions automatically
      const realCaptions = await fetchYoutubeCaptions(videoId)
      if (realCaptions && realCaptions.length > 0) {
        setSegments(realCaptions)
        const lastSeg = realCaptions[realCaptions.length - 1]
        const fullDuration = lastSeg?.end || 3229
        setMediaDuration(fullDuration)
        setSource(prev => ({ ...prev, duration: fullDuration }))
        setStatus('ready')
        return
      }
    } catch (e) {
      console.warn('YouTube caption fetch error:', e)
    }

    // Desktop can obtain the real audio after explicit user action. Do not fabricate
    // a transcript from only the video ID when public captions are unavailable.
    if (window.frameFinderDesktop?.isElectron) {
      setStatus('ready')
      setError(
          apiKey || apiProvider === 'local'
          ? msg('Brak dostępnych napisów. Uruchom transkrypcję, aby pobrać audio.', 'No captions are available. Start transcription to download and transcribe the audio.', 'Keine Untertitel verfügbar. Starte die Transkription, um das Audio herunterzuladen und zu transkribieren.')
          : msg('Brak dostępnych napisów. Dodaj klucz OpenAI lub Groq, a następnie uruchom transkrypcję.', 'No captions are available. Add an OpenAI or Groq key, then start transcription.', 'Keine Untertitel verfügbar. Füge einen OpenAI- oder Groq-Schlüssel hinzu und starte dann die Transkription.')
      )
      return
    }

    if (apiKey && apiProvider === 'openai') {
      try {
        const targetDur = mediaDuration || 3229
        const aiSegments = await transcribeYoutubeWithOpenAI('Film YouTube ' + videoId, apiKey, targetDur)
        if (aiSegments && aiSegments.length > 0) {
          setSegments(aiSegments)
          const lastSeg = aiSegments[aiSegments.length - 1]
          const fullDuration = lastSeg?.end || targetDur
          setMediaDuration(fullDuration)
          setSource(prev => ({ ...prev, duration: fullDuration }))
          setStatus('ready')
          return
        }
      } catch (e) {
        console.warn('OpenAI YT fallback error:', e)
      }
    } else if (apiKey && apiProvider === 'gemini') {
      try {
        const geminiSegments = await transcribeWithGemini('Film YouTube ' + videoId, apiKey)
        if (geminiSegments && geminiSegments.length > 0) {
          setSegments(geminiSegments)
          const lastSeg = geminiSegments[geminiSegments.length - 1]
          const fullDuration = lastSeg?.end || 3229
          setMediaDuration(fullDuration)
          setSource(prev => ({ ...prev, duration: fullDuration }))
          setStatus('ready')
          return
        }
      } catch (e) {
        console.warn('Gemini YT fallback error:', e)
      }
    }

    setStatus('ready')
    setError(
      msg('Ten film nie posiada wbudowanych napisów. Uruchom transkrypcję lub dodaj klucz API.', 'This video has no embedded captions. Start transcription or add your API key.', 'Dieses Video hat keine eingebetteten Untertitel. Starte die Transkription oder füge deinen API-Schlüssel hinzu.')
    )
  }

  const loadDemo = () => {
    setSource({ type: 'demo', name: msg('Rozmowa z zespołem.mp4', 'Team conversation.mp4', 'Teamgespräch.mp4'), size: 48200000 })
    setLocalUrl('')
    setSegments(demoData)
    setStatus('ready')
    setResults([])
    setAiAnswer('')
    setExactQuote('')
    setError('')
    setCurrentTime(0)
    setMediaDuration(116)
  }

  const search = async eventOrQuery => {
    if (typeof eventOrQuery !== 'string') eventOrQuery?.preventDefault()
    const searchQuery = typeof eventOrQuery === 'string' ? eventOrQuery : query
    if (!searchQuery.trim() || !segments.length) return
    setStatus('searching')
    setError('')
    setAiAnswer('')
    setExactQuote('')

    // 1. AI Semantic Agent Search with Strict Grounding
    if (apiKey && apiProvider === 'openai') {
      try {
        const aiData = await performAiSemanticSearch(searchQuery, segments, apiKey)
        if (aiData && aiData.matches && aiData.matches.length > 0) {
          if (aiData.aiAnswer) setAiAnswer(aiData.aiAnswer)
          if (aiData.exactQuote) setExactQuote(aiData.exactQuote)
          setResults(aiData.matches)
          setStatus('ready')
          return
        }
      } catch (e) {
        console.warn('AI Semantic Search error, fallback to keyword search:', e)
      }
    }

    // 2. Keyword, Stem, and Synonym Matcher
    const rawWords = [...new Set(queryWords(searchQuery))]
    const normalizedQuery = removeAccents(searchQuery.toLowerCase()).trim()

    const synonyms = []
    if (normalizedQuery.includes('nord') || normalizedQuery.includes('nordam')) {
      synonyms.push('norman', 'skandynaw', 'wiking', 'polnoc', 'badawcz', 'genet')
    }

    const scored = segments
      .map(segment => {
        const segTextNorm = removeAccents(segment.text.toLowerCase())

        let score = 0
        if (segTextNorm.includes(normalizedQuery)) {
          score += 20
        }

        rawWords.forEach(word => {
          if (word.length < 2) return
          if (segTextNorm.includes(word)) {
            score += 5
          } else {
            const cleanWordStem = word.slice(0, Math.min(word.length - 1, 4))
            if (cleanWordStem.length >= 3 && segTextNorm.includes(cleanWordStem)) {
              score += 3
            }
          }
        })

        synonyms.forEach(syn => {
          if (segTextNorm.includes(syn)) {
            score += 8
          }
        })

        const maxScore = 20 + rawWords.length * 5
        return {
          ...segment,
          score,
          matchPercent: Math.min(100, Math.round((score / maxScore) * 100))
        }
      })
      .sort((a, b) => b.score - a.score)

    const matches = scored.filter(segment => segment.score > 0)

    if (matches.length > 0) {
      setResults(matches.slice(0, 8))
    } else {
      setResults([])
      setError(msg('Nie znaleziono pasujących fragmentów. Spróbuj zmienić zapytanie.', 'No matching moments were found. Try changing your query.', 'Keine passenden Momente gefunden. Versuche eine andere Suchanfrage.'))
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
      <Topbar
        apiKey={apiKey}
        apiProvider={apiProvider}
        onOpenApiModal={() => setIsApiModalOpen(true)}
      />
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
              transcriptionProgress={transcriptionProgress}
              error={error}
              currentTime={currentTime}
              apiKey={apiKey}
              apiProvider={apiProvider}
              onOpenApiModal={() => setIsApiModalOpen(true)}
              onDurationDiscovered={realDur => {
                if (realDur && realDur > mediaDuration) {
                  setMediaDuration(realDur)
                  setSource(prev => ({ ...prev, duration: realDur }))
                }
              }}
              onCustomSegmentsImport={customSegs => {
                setSegments(customSegs)
                const lastSeg = customSegs[customSegs.length - 1]
                if (lastSeg?.end) setMediaDuration(lastSeg.end)
                setStatus('ready')
                setError('')
              }}
            />

            <SearchPanel
              query={query}
              setQuery={setQuery}
              search={search}
              segments={segments}
              status={status}
              results={results}
              aiAnswer={aiAnswer}
              exactQuote={exactQuote}
              activeResult={activeResult}
              playClip={playClip}
              sourceName={source.name}
            />
          </section>
        )}

        <WorkflowFooter />
      </main>

      <ApiKeyModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        apiKey={apiKey}
        apiProvider={apiProvider}
        onSaveKey={handleSaveApiKey}
        onClearKey={handleClearApiKey}
        onSwitchToDemo={loadDemo}
      />

      <NoKeyModal
        isOpen={isNoKeyModalOpen}
        onClose={() => setIsNoKeyModalOpen(false)}
        onOpenSettings={() => setIsApiModalOpen(true)}
        onUseDemo={loadDemo}
      />
    </div>
  )
}
