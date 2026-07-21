import React from 'react'

export function WorkflowFooter() {
  return (
    <>
      <section className="workflow" id="workflow">
        <span className="workflow-label">Jak to działa</span>
        <div className="workflow-items">
          <div>
            <b>01</b>
            <span>
              <strong>Dodaj link lub plik</strong>
              <small>YouTube, wideo lub audio</small>
            </span>
          </div>
          <div>
            <b>02</b>
            <span>
              <strong>Zadaj pytanie</strong>
              <small>Własnymi słowami</small>
            </span>
          </div>
          <div>
            <b>03</b>
            <span>
              <strong>Odtwórz scenę</strong>
              <small>Od właściwej sekundy</small>
            </span>
          </div>
        </div>
      </section>

      <footer>
        <span>© 2026 FRAMEFINDER</span>
        <p>Prywatne nagrania. Precyzyjne odpowiedzi.</p>
        <span>PL / EN</span>
      </footer>
    </>
  )
}
