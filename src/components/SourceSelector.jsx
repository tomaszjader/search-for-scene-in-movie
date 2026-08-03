import React, { useRef } from 'react'
import { Link2, LoaderCircle, Play, Upload } from 'lucide-react'
import { useI18n } from '../i18n'

export function SourceSelector({
  youtubeUrl,
  setYoutubeUrl,
  importYoutube,
  choose,
  loadDemo,
  status,
  error
}) {
  const { t } = useI18n()
  const inputRef = useRef()

  return (
    <section className="source-stage">
      <form className="youtube-import" onSubmit={importYoutube}>
        <div className="youtube-icon">
          <Play size={25} fill="currentColor" />
        </div>
        <div className="youtube-copy">
          <span className="step-label">{t('youtubeLink')}</span><strong>{t('pasteLink')}</strong><small>{t('directYoutube')}</small>
        </div>
        <div className="url-field">
          <Link2 size={17} />
          <input
            type="url"
            value={youtubeUrl}
            onChange={event => setYoutubeUrl(event.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <button disabled={!youtubeUrl.trim() || status === 'importing'}>
            {status === 'importing' ? <LoaderCircle className="spin" size={17} /> : t('open')}
          </button>
        </div>
      </form>

      <div className="source-divider">
        <span>{t('or')}</span>
      </div>

      <div
        className="upload-stage compact"
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault()
          choose(event.dataTransfer.files[0])
        }}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*,audio/*"
          hidden
          onChange={event => choose(event.target.files[0])}
        />
        <div className="upload-orbit">
          <Upload size={23} />
        </div>
        <div>
          <span className="step-label">{t('diskFile')}</span><h2>{t('drop')}</h2><p>{t('maxFile')}</p>
        </div>
        <button
          className="text-action"
          onClick={event => {
            event.stopPropagation()
            loadDemo()
          }}
        >
          <Play size={12} fill="currentColor" /> {t('demo')}
        </button>
      </div>
      {error && <div className="error source-error">{error}</div>}
    </section>
  )
}
