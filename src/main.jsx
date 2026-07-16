import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, Captions, Check, Clock3, Command, CornerDownLeft, Link2, LoaderCircle, Play, Search, Sparkles, Upload, X } from 'lucide-react'
import './styles.css'

const demo = [
  { id: 1, start: 4, end: 13, text: 'Zaczęliśmy ten projekt od prostego pytania: dlaczego znalezienie jednej sceny w godzinnym nagraniu trwa tak długo?' },
  { id: 2, start: 18, end: 29, text: 'Marta jako pierwsza zaproponowała, żeby nie szukać po słowach, tylko po znaczeniu całej wypowiedzi.' },
  { id: 3, start: 34, end: 46, text: 'Najtrudniejszy moment przyszedł w marcu. Mieliśmy wtedy zaledwie dwa tygodnie, żeby pokazać działający prototyp.' },
  { id: 4, start: 51, end: 63, text: 'To właśnie rozmowa z Pawłem zmieniła kierunek produktu. Powiedział, że użytkownik nie chce transkrypcji — chce od razu zobaczyć właściwy fragment.' },
  { id: 5, start: 68, end: 80, text: 'Po pierwszych testach okazało się, że ludzie szukają też emocji, na przykład momentu, w którym rozmówca jest zaskoczony albo niepewny.' },
  { id: 6, start: 86, end: 98, text: 'Dziś system rozumie pytania zadane naturalnym językiem i potrafi wskazać kilka pasujących miejsc.' }
]

const fmt = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`

const queryWords = value => value.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(word => word.length > 2) || []

const youtubeId = value => {
  try {
    const url = new URL(value.trim())
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0]
    if (url.hostname.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v')
      return url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1] || null
    }
  } catch {}
  return null
}

function HighlightedText({ text, query }) {
  const words = queryWords(query)
  if (!words.length) return text
  const pattern = new RegExp(`(${words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'giu')
  return text.split(pattern).map((part, index) => words.includes(part.toLowerCase()) ? <mark key={index}>{part}</mark> : part)
}

function App() {
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
  const input = useRef()
  const video = useRef()
  const clipEnd = useRef(null)

  const choose = file => {
    if (!file) return
    if (localUrl) URL.revokeObjectURL(localUrl)
    setSource({ type: 'file', name: file.name, size: file.size, file })
    setLocalUrl(URL.createObjectURL(file)); setSegments([]); setResults([]); setError('')
  }

  const reset = () => {
    if (localUrl) URL.revokeObjectURL(localUrl)
    setSource(null); setLocalUrl(''); setYoutubeUrl(''); setSegments([]); setResults([]); setQuery(''); setError(''); setStatus('idle'); setEmbedRange(null)
  }

  const transcribe = () => {
    if (!source?.file) return
    setError('Automatyczna transkrypcja wymaga usługi serwerowej. W wersji frontendowej możesz odtworzyć plik lub skorzystać z materiału demo.')
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
    setSegments([]); setResults([]); setEmbedRange(null); setStatus('ready'); setError('')
  }

  const loadDemo = () => {
    setSource({ type: 'demo', name: 'Rozmowa z zespołem.mp4', size: 48200000 }); setLocalUrl(''); setSegments(demo); setStatus('ready'); setResults([]); setError('')
  }

  const search = event => {
    event?.preventDefault()
    if (!query.trim() || !segments.length) return
    setStatus('searching'); setError('')
    const words = queryWords(query)
    const scored = segments.map(segment => ({ ...segment, score: words.filter(word => segment.text.toLowerCase().includes(word)).length })).sort((a, b) => b.score - a.score)
    setResults((scored[0]?.score ? scored.filter(segment => segment.score > 0) : scored).slice(0, 3)); setStatus('ready')
    if (!scored[0]?.score) setError('Brak dokładnego dopasowania — pokazuję najbliższe fragmenty demonstracyjne.')
  }

  const playClip = segment => {
    setActiveResult(segment.id)
    if (source?.type === 'youtube') { setEmbedRange({ start: Math.floor(segment.start), end: Math.ceil(segment.end) }); return }
    if (!video.current || !localUrl) return
    clipEnd.current = segment.end; video.current.currentTime = segment.start; video.current.play()
  }

  const watchClipEnd = () => {
    if (!video.current || clipEnd.current === null) return
    if (video.current.currentTime >= clipEnd.current) { video.current.pause(); clipEnd.current = null; setActiveResult(null) }
  }

  const embedUrl = source?.type === 'youtube' ? `https://www.youtube.com/embed/${source.videoId}?autoplay=${embedRange ? 1 : 0}&start=${embedRange?.start || 0}${embedRange ? `&end=${embedRange.end}` : ''}&rel=0` : ''
  const duration = Math.max(source?.duration || 0, ...segments.map(segment => segment.end), 1)

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Play size={12} fill="currentColor" /></span><span>framefinder</span></a><div className="top-status"><i /> Frontend-only <span>v2.0</span></div><a className="how-link" href="#workflow">Jak to działa <ArrowUpRight size={14} /></a></header>
    <main>
      <section className="hero"><div className="hero-kicker"><Sparkles size={13} /> Wyszukiwarka momentów w wideo</div><h1>Zapytaj nagranie.<br /><em>Znajdź właściwy kadr.</em></h1><p>Wklej link YouTube lub dodaj własny plik. Opisz scenę, wypowiedź albo temat, a dostaniesz dokładny fragment.</p><div className="hero-meta"><span>YOUTUBE + PLIKI</span><span>JĘZYK NATURALNY</span><span>PRECYZJA DO SEKUNDY</span></div></section>

      {!source ? <section className="source-stage">
        <form className="youtube-import" onSubmit={importYoutube}><div className="youtube-icon"><Play size={25} fill="currentColor" /></div><div className="youtube-copy"><span className="step-label">01 / LINK YOUTUBE</span><strong>Wklej link do filmu</strong><small>Odtwarzanie bezpośrednio z YouTube</small></div><div className="url-field"><Link2 size={17} /><input type="url" value={youtubeUrl} onChange={event => setYoutubeUrl(event.target.value)} placeholder="https://youtube.com/watch?v=..." /><button disabled={!youtubeUrl.trim() || status === 'importing'}>{status === 'importing' ? <LoaderCircle className="spin" size={17} /> : 'Otwórz'}</button></div></form>
        <div className="source-divider"><span>albo</span></div>
        <div className="upload-stage compact" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files[0]) }} onClick={() => input.current.click()}><input ref={input} type="file" accept="video/*,audio/*" hidden onChange={event => choose(event.target.files[0])} /><div className="upload-orbit"><Upload size={23} /></div><div><span className="step-label">PLIK Z DYSKU</span><h2>Upuść nagranie lub wybierz plik</h2><p>MP4, WEBM, MP3, WAV · maks. 200 MB</p></div><button className="text-action" onClick={event => { event.stopPropagation(); loadDemo() }}><Play size={12} fill="currentColor" /> Demo</button></div>
        {error && <div className="error source-error">{error}</div>}
      </section> : <section className="workspace">
        <aside className="media-panel panel"><div className="panel-heading"><span className="panel-index">01</span><div className="file-copy"><strong>{source.name}</strong><small>{source.type === 'youtube' ? `${source.author} · YouTube` : `${((source.size || 0) / 1000000).toFixed(1)} MB`} · {segments.length ? `${segments.length} fragmentów` : 'gotowy do analizy'}</small></div><button className="icon-button" onClick={reset} aria-label="Usuń materiał"><X size={16} /></button></div>
          <div className="viewer">{source.type === 'youtube' ? <iframe key={embedUrl} src={embedUrl} title={source.name} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : localUrl ? <video ref={video} src={localUrl} controls onTimeUpdate={watchClipEnd} /> : <div className="demo-view"><span className="demo-play"><Play size={21} fill="currentColor" /></span><strong>Materiał demonstracyjny</strong><small>01:56 · rozmowa zespołu</small></div>}<div className="view-tag">SOURCE / {source.type === 'youtube' ? 'YT' : '01'}</div></div>
          {segments.length ? <><div className="analysis-ready"><span><Check size={13} /> Analiza gotowa</span><b>{source.transcriptSource === 'audio' ? 'transkrypcja z audio' : `${segments.length} segmentów`}</b></div>{results.length > 0 && <div className="result-timeline" aria-label="Znalezione fragmenty na osi czasu"><div className="timeline-label"><span>Znalezione fragmenty</span><b>{fmt(duration)}</b></div><div className="timeline-track">{results.map((result, index) => <button key={result.id} className={`timeline-hit ${activeResult === result.id ? 'active' : ''}`} style={{ left: `${result.start / duration * 100}%`, width: `${Math.max((result.end - result.start) / duration * 100, 2.5)}%` }} onClick={() => playClip(result)} title={`Wynik ${index + 1}: ${fmt(result.start)}–${fmt(result.end)}`}><span>{index + 1}</span></button>)}</div><div className="timeline-scale"><span>00:00</span><span>{fmt(duration / 2)}</span><span>{fmt(duration)}</span></div></div>}</> : <button className="primary-action" onClick={transcribe} disabled={status === 'transcribing'}>{status === 'transcribing' ? <LoaderCircle className="spin" size={17} /> : <Captions size={17} />}{status === 'transcribing' ? 'Analizuję materiał…' : 'Utwórz transkrypcję'}</button>}{error && <div className="error">{error}</div>}
        </aside>
        <section className="search-panel panel"><div className="panel-heading search-heading"><span className="panel-index">02</span><div><strong>Znajdź moment</strong><small>Opisz scenę, wypowiedź lub emocję</small></div><div className="key"><Command size={11} /> K</div></div><form onSubmit={search} className="search-field"><Search size={19} /><input value={query} onChange={event => setQuery(event.target.value)} disabled={!segments.length} placeholder="Gdzie rozmówca mówi o zmianie produktu?" /><button disabled={!query.trim() || !segments.length} aria-label="Szukaj">{status === 'searching' ? <LoaderCircle className="spin" size={17} /> : <CornerDownLeft size={16} />}</button></form><div className="suggestions"><span>Podpowiedzi</span>{['Co było najtrudniejsze?', 'Jaki jest główny wniosek?', 'Jakie są plany?'].map(item => <button key={item} onClick={() => setQuery(item)}>{item}</button>)}</div>
          <div className="results-area">{!results.length ? <div className="empty-state"><div className="empty-glyph"><Search size={20} /></div><strong>{segments.length ? 'Materiał czeka na pytanie' : 'Najpierw przeanalizuj nagranie'}</strong><p>Każdy wynik otrzyma dokładny timestamp i cytat z transkrypcji.</p></div> : <><div className="results-header"><span>Najlepsze dopasowania</span><b>{String(results.length).padStart(2, '0')}</b></div><div className="result-list">{results.map((result, index) => <button className={`result-card ${activeResult === result.id ? 'active' : ''}`} key={result.id} onClick={() => playClip(result)}><span className="result-number">0{index + 1}</span><div className="result-content"><div className="result-meta"><span><Clock3 size={12} /> {fmt(result.start)} — {fmt(result.end)}</span><b>{activeResult === result.id ? 'PLAYING' : `${Math.max(78, 96 - index * 7)}% MATCH`}</b></div><p>„{result.text}”</p></div><span className="result-play"><Play size={13} fill="currentColor" /></span></button>)}</div></>}</div>
        </section>
      </section>}
      <section className="workflow" id="workflow"><span className="workflow-label">Jak to działa</span><div className="workflow-items"><div><b>01</b><span><strong>Dodaj link lub plik</strong><small>YouTube, wideo lub audio</small></span></div><div><b>02</b><span><strong>Zadaj pytanie</strong><small>Własnymi słowami</small></span></div><div><b>03</b><span><strong>Odtwórz scenę</strong><small>Od właściwej sekundy</small></span></div></div></section>
    </main><footer><span>© 2026 FRAMEFINDER</span><p>Prywatne nagrania. Precyzyjne odpowiedzi.</p><span>PL / EN</span></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
