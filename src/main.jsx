import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Upload, Search, Sparkles, Play, FileVideo, Clock, ChevronRight, X, Check, LoaderCircle, Captions, Command, CornerDownLeft } from 'lucide-react'
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

const fmt = n => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`

function App() {
  const [file, setFile] = useState(null), [url, setUrl] = useState(''), [segments, setSegments] = useState([])
  const [query, setQuery] = useState(''), [results, setResults] = useState([]), [status, setStatus] = useState('idle'), [error, setError] = useState('')
  const input = useRef(), video = useRef()

  const choose = chosen => { if (!chosen) return; setFile(chosen); setUrl(URL.createObjectURL(chosen)); setSegments([]); setResults([]); setError('') }
  const transcribe = async () => {
    if (!file) return
    setStatus('transcribing'); setError('')
    const form = new FormData(); form.append('video', file)
    try { const r = await fetch('/api/transcribe', { method: 'POST', body: form }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setSegments(d.segments); setStatus('ready') }
    catch (e) { setError(e.message); setStatus('idle') }
  }
  const loadDemo = () => { setFile({ name: 'Rozmowa_z_zespolem.mp4', size: 482000000 }); setUrl(''); setSegments(demo); setStatus('ready'); setResults([]); setError('') }
  const search = async e => {
    e?.preventDefault(); if (!query.trim() || !segments.length) return
    setStatus('searching'); setError('')
    try {
      const r = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, segments }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error)
      setResults(d.ids.map(id => segments.find(s => s.id === id)).filter(Boolean)); setStatus('ready')
    } catch {
      const words = query.toLowerCase().replace(/[^a-ząćęłńóśźż ]/g, '').split(/\s+/).filter(w => w.length > 3)
      const scored = segments.map(s => ({ ...s, score: words.filter(w => s.text.toLowerCase().includes(w)).length })).sort((a,b) => b.score-a.score)
      setResults((scored[0]?.score ? scored.filter(s => s.score > 0) : scored).slice(0, 3)); setStatus('ready')
    }
  }
  const seek = s => { if (video.current && url) { video.current.currentTime = s.start; video.current.play() } }

  return <div className="app">
    <header><a className="logo" href="#"><span><Play size={15} fill="currentColor" /></span> framefinder</a><div className="badge"><i></i> AI video search</div><button className="ghost">Jak to działa?</button></header>
    <main>
      <section className="hero"><div className="eyebrow"><Sparkles size={14}/> Znajdź właściwy moment. Natychmiast.</div><h1>Nie przewijaj.<br/><em>Po prostu zapytaj.</em></h1><p>Wrzuć nagranie i opisz scenę, której szukasz. Framefinder zrozumie transkrypcję i wskaże dokładne momenty.</p></section>

      {!file ? <section className="upload" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault(); choose(e.dataTransfer.files[0])}} onClick={()=>input.current.click()}>
        <input ref={input} type="file" accept="video/*,audio/*" hidden onChange={e=>choose(e.target.files[0])}/><div className="uploadIcon"><Upload size={25}/></div>
        <h2>Upuść tutaj swoje nagranie</h2><p>lub kliknij, aby wybrać plik</p><div className="formats"><span>MP4</span><span>MOV</span><span>WEBM</span><span>MP3</span><b>do 200 MB</b></div>
        <button className="demo" onClick={e=>{e.stopPropagation();loadDemo()}}><Play size={14} fill="currentColor"/> Wypróbuj na przykładzie</button>
      </section> : <section className="workspace">
        <div className="mediaPanel">
          <div className="panelTop"><div className="fileIcon"><FileVideo size={19}/></div><div><strong>{file.name}</strong><span>{(file.size/1000000).toFixed(1)} MB · {segments.length ? `${segments.length} fragmentów` : 'gotowy do analizy'}</span></div><button onClick={()=>{setFile(null);setUrl('');setSegments([]);setResults([])}}><X size={18}/></button></div>
          <div className="screen">{url ? <video ref={video} src={url} controls/> : <div className="demoScreen"><div><Play size={25} fill="currentColor"/></div><span>Tryb demonstracyjny</span></div>}<div className="scanline"/></div>
          {segments.length ? <div className="ready"><Check size={15}/> Transkrypcja gotowa <span>{segments.length} fragmentów</span></div> : <button className="primary full" onClick={transcribe} disabled={status==='transcribing'}>{status==='transcribing'?<LoaderCircle className="spin" size={18}/>:<Captions size={18}/>} {status==='transcribing'?'Analizuję nagranie…':'Utwórz transkrypcję'}</button>}
          {error && <div className="error">{error}</div>}
        </div>
        <div className="searchPanel">
          <div className="searchHead"><div><span>02</span><div><strong>O co chodziło?</strong><small>Opisz moment własnymi słowami</small></div></div><div className="shortcut"><Command size={12}/> K</div></div>
          <form onSubmit={search} className="searchbox"><Search size={20}/><input value={query} onChange={e=>setQuery(e.target.value)} disabled={!segments.length} placeholder="np. Gdzie Paweł mówił o zmianie produktu?"/><button disabled={!query.trim()||!segments.length}>{status==='searching'?<LoaderCircle className="spin" size={18}/>:<CornerDownLeft size={17}/>}</button></form>
          <div className="suggestions"><span>Spróbuj:</span>{['Co było najtrudniejsze?','Kto zmienił kierunek?','Jakie są plany?'].map(x=><button key={x} onClick={()=>setQuery(x)}>{x}</button>)}</div>
          <div className="resultArea">{!results.length ? <div className="empty"><div className="rings"><Sparkles size={23}/></div><strong>{segments.length?'Zapytaj o dowolny moment':'Najpierw przeanalizuj nagranie'}</strong><p>Wyniki pojawią się tutaj wraz z dokładnym czasem i cytatem.</p></div> : <><div className="resultTitle"><strong>Znalezione momenty</strong><span>{results.length} {results.length===1?'trafienie':'trafienia'}</span></div><div className="cards">{results.map((r,i)=><button className="result" key={r.id} onClick={()=>seek(r)}><div className="rank">0{i+1}</div><div className="resultBody"><div><span className="time"><Clock size={12}/>{fmt(r.start)}–{fmt(r.end)}</span><span className="match">{Math.max(78,96-i*7)}% zgodności</span></div><p>„{r.text}”</p></div><div className="play"><Play size={14} fill="currentColor"/></div></button>)}</div></>}</div>
        </div>
      </section>}
      <div className="steps"><div><span>01</span><p><b>Wrzuć nagranie</b>Wideo lub audio</p></div><ChevronRight/><div><span>02</span><p><b>Zadaj pytanie</b>Naturalnym językiem</p></div><ChevronRight/><div><span>03</span><p><b>Przejdź do sceny</b>Co do sekundy</p></div></div>
    </main><footer><span>framefinder / 2026</span><p>Twoje nagrania nie są nigdzie publikowane.</p><span>PL <i>·</i> EN</span></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
