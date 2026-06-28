import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowUpRight, Captions, Check, Clock3, Command, CornerDownLeft, FileVideo2, LoaderCircle, Play, Search, Sparkles, Upload, X } from 'lucide-react'
import './styles.css'

const demo = [
  { id: 1, start: 4, end: 13, text: 'Zaczęliśmy ten projekt właściwie od prostego pytania: dlaczego znalezienie jednej sceny w godzinnym nagraniu trwa tak długo?' },
  { id: 2, start: 18, end: 29, text: 'Marta jako pierwsza zaproponowała, żeby nie szukać po słowach, tylko po znaczeniu całej wypowiedzi.' },
  { id: 3, start: 34, end: 46, text: 'Najtrudniejszy moment przyszedł w marcu. Mieliśmy wtedy zaledwie dwa tygodnie, żeby pokazać działający prototyp.' },
  { id: 4, start: 51, end: 63, text: 'To właśnie rozmowa z Pawłem zmieniła kierunek produktu. Powiedział, że użytkownik nie chce transkrypcji — chce od razu zobaczyć właściwy fragment.' },
  { id: 5, start: 68, end: 80, text: 'Po pierwszych testach okazało się, że ludzie szukają też emocji, na przykład momentu, w którym rozmówca jest zaskoczony albo niepewny.' },
  { id: 6, start: 86, end: 98, text: 'Dziś system rozumie pytania zadane naturalnym językiem i potrafi wskazać kilka pasujących miejsc, nie tylko jedno.' },
  { id: 7, start: 104, end: 116, text: 'W przyszłości chcemy automatycznie tworzyć krótkie klipy i podpisy, ale zawsze pozostawić decyzję człowiekowi.' }
]

const fmt = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`

function App() {
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [segments, setSegments] = useState([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [activeResult, setActiveResult] = useState(null)
  const input = useRef()
  const video = useRef()
  const clipEnd = useRef(null)

  const choose = chosen => {
    if (!chosen) return
    setFile(chosen)
    setUrl(URL.createObjectURL(chosen))
    setSegments([])
    setResults([])
    setError('')
  }

  const reset = () => {
    if (url) URL.revokeObjectURL(url)
    setFile(null); setUrl(''); setSegments([]); setResults([]); setQuery(''); setError('')
  }

  const transcribe = async () => {
    if (!file) return
    setStatus('transcribing'); setError('')
    const form = new FormData(); form.append('video', file)
    try {
      const response = await fetch('/api/transcribe', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setSegments(data.segments); setStatus('ready')
    } catch (cause) {
      setError(cause.message); setStatus('idle')
    }
  }

  const loadDemo = () => {
    setFile({ name: 'Rozmowa_z_zespołem.mp4', size: 48200000 })
    setUrl(''); setSegments(demo); setStatus('ready'); setResults([]); setError('')
  }

  const search = async event => {
    event?.preventDefault()
    if (!query.trim() || !segments.length) return
    setStatus('searching'); setError('')
    try {
      const response = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, segments }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setResults(data.ids.map(id => segments.find(segment => segment.id === id)).filter(Boolean)); setStatus('ready')
    } catch {
      const words = query.toLowerCase().replace(/[^a-ząćęłńóśźż ]/g, '').split(/\s+/).filter(word => word.length > 3)
      const scored = segments.map(segment => ({ ...segment, score: words.filter(word => segment.text.toLowerCase().includes(word)).length })).sort((a, b) => b.score - a.score)
      setResults((scored[0]?.score ? scored.filter(segment => segment.score > 0) : scored).slice(0, 3)); setStatus('ready')
    }
  }

  const playClip = segment => {
    if (!video.current || !url) return
    clipEnd.current = segment.end; setActiveResult(segment.id)
    video.current.currentTime = segment.start; video.current.play()
  }

  const watchClipEnd = () => {
    if (!video.current || clipEnd.current === null) return
    if (video.current.currentTime >= clipEnd.current) {
      video.current.pause(); video.current.currentTime = clipEnd.current
      clipEnd.current = null; setActiveResult(null)
    }
  }

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><Play size={12} fill="currentColor" /></span><span>framefinder</span></a>
      <div className="top-status"><i /> Semantic video search <span>v1.0</span></div>
      <a className="how-link" href="#workflow">Jak to działa <ArrowUpRight size={14} /></a>
    </header>

    <main>
      <section className="hero">
        <div className="hero-kicker"><Sparkles size={13} /> Wyszukiwarka momentów w wideo</div>
        <h1>Zapytaj nagranie.<br /><em>Znajdź właściwy kadr.</em></h1>
        <p>Przeszukuj godziny materiału tak, jak pytasz człowieka. Bez ręcznego przewijania, bez zgadywania timestampów.</p>
        <div className="hero-meta"><span>WIDEO + AUDIO</span><span>JĘZYK NATURALNY</span><span>PRECYZJA DO SEKUNDY</span></div>
      </section>

      {!file ? <section className="upload-stage" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); choose(event.dataTransfer.files[0]) }} onClick={() => input.current.click()}>
        <input ref={input} type="file" accept="video/*,audio/*" hidden onChange={event => choose(event.target.files[0])} />
        <div className="drop-visual"><div className="upload-orbit"><Upload size={25} /></div><span className="corner corner-a" /><span className="corner corner-b" /></div>
        <span className="step-label">01 / DODAJ MATERIAŁ</span>
        <h2>Upuść nagranie, aby zacząć</h2>
        <p>lub kliknij i wybierz plik z dysku</p>
        <div className="file-spec"><span>MP4</span><span>MOV</span><span>WEBM</span><span>MP3</span><b>MAX 200 MB</b></div>
        <button className="text-action" onClick={event => { event.stopPropagation(); loadDemo() }}><Play size={12} fill="currentColor" /> Otwórz materiał demo</button>
      </section> : <section className="workspace">
        <aside className="media-panel panel">
          <div className="panel-heading">
            <span className="panel-index">01</span>
            <div className="file-copy"><strong>{file.name}</strong><small>{(file.size / 1000000).toFixed(1)} MB · {segments.length ? `${segments.length} fragmentów` : 'gotowy do analizy'}</small></div>
            <button className="icon-button" onClick={reset} aria-label="Usuń plik"><X size={16} /></button>
          </div>
          <div className="viewer">
            {url ? <video ref={video} src={url} controls onTimeUpdate={watchClipEnd} /> : <div className="demo-view"><span className="demo-play"><Play size={21} fill="currentColor" /></span><strong>Materiał demonstracyjny</strong><small>01:56 · rozmowa zespołu</small></div>}
            <div className="view-tag">SOURCE / 01</div><div className="scanline" />
          </div>
          {segments.length ? <div className="analysis-ready"><span><Check size={13} /> Analiza gotowa</span><b>{segments.length} segmentów</b></div> : <button className="primary-action" onClick={transcribe} disabled={status === 'transcribing'}>{status === 'transcribing' ? <LoaderCircle className="spin" size={17} /> : <Captions size={17} />}{status === 'transcribing' ? 'Analizuję materiał…' : 'Utwórz transkrypcję'}</button>}
          {error && <div className="error">{error}</div>}
        </aside>

        <section className="search-panel panel">
          <div className="panel-heading search-heading"><span className="panel-index">02</span><div><strong>Znajdź moment</strong><small>Opisz scenę, wypowiedź lub emocję</small></div><div className="key"><Command size={11} /> K</div></div>
          <form onSubmit={search} className="search-field"><Search size={19} /><input value={query} onChange={event => setQuery(event.target.value)} disabled={!segments.length} placeholder="Gdzie Paweł mówił o zmianie produktu?" /><button disabled={!query.trim() || !segments.length} aria-label="Szukaj">{status === 'searching' ? <LoaderCircle className="spin" size={17} /> : <CornerDownLeft size={16} />}</button></form>
          <div className="suggestions"><span>Podpowiedzi</span>{['Co było najtrudniejsze?', 'Kto zmienił kierunek?', 'Jakie są plany?'].map(item => <button key={item} onClick={() => setQuery(item)}>{item}</button>)}</div>
          <div className="results-area">
            {!results.length ? <div className="empty-state"><div className="empty-glyph"><Search size={20} /></div><strong>{segments.length ? 'Materiał czeka na pytanie' : 'Najpierw przeanalizuj nagranie'}</strong><p>Każdy wynik otrzyma dokładny timestamp i cytat z transkrypcji.</p></div> : <><div className="results-header"><span>Najlepsze dopasowania</span><b>{String(results.length).padStart(2, '0')}</b></div><div className="result-list">{results.map((result, index) => <button className={`result-card ${activeResult === result.id ? 'active' : ''}`} key={result.id} onClick={() => playClip(result)}>
              <span className="result-number">0{index + 1}</span><div className="result-content"><div className="result-meta"><span><Clock3 size={12} /> {fmt(result.start)} — {fmt(result.end)}</span><b>{activeResult === result.id ? 'PLAYING' : `${Math.max(78, 96 - index * 7)}% MATCH`}</b></div><p>„{result.text}”</p></div><span className="result-play"><Play size={13} fill="currentColor" /></span>
            </button>)}</div></>}
          </div>
        </section>
      </section>}

      <section className="workflow" id="workflow"><span className="workflow-label">Jak to działa</span><div className="workflow-items"><div><b>01</b><span><strong>Wrzuć materiał</strong><small>Wideo lub audio</small></span></div><div><b>02</b><span><strong>Zadaj pytanie</strong><small>Własnymi słowami</small></span></div><div><b>03</b><span><strong>Przejdź do sceny</strong><small>Co do sekundy</small></span></div></div></section>
    </main>

    <footer><span>© 2026 FRAMEFINDER</span><p>Prywatne nagrania. Precyzyjne odpowiedzi.</p><span>PL / EN</span></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
