import React from 'react'
import { Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-kicker">
        <Sparkles size={13} /> Wyszukiwarka momentów w wideo
      </div>
      <h1>
        Zapytaj nagranie.<br />
        <em>Znajdź właściwy kadr.</em>
      </h1>
      <p>
        Wklej link YouTube lub dodaj własny plik. Opisz scenę, wypowiedź albo temat, a dostaniesz dokładny fragment.
      </p>
      <div className="hero-meta">
        <span>YOUTUBE + PLIKI</span>
        <span>JĘZYK NATURALNY</span>
        <span>PRECYZJA DO SEKUNDY</span>
      </div>
    </section>
  )
}
