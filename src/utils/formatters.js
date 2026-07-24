export const fmt = value =>
  `${String(Math.floor((value || 0) / 60)).padStart(2, '0')}:${String(Math.floor((value || 0) % 60)).padStart(2, '0')}`

export const removeAccents = str =>
  str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : ''

export const queryWords = value =>
  removeAccents(value.toLowerCase())
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter(word => word.length > 1) || []

export const youtubeId = value => {
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

export const exportToSRT = (segments, title = 'transkrypcja') => {
  const formatSrtTime = sec => {
    const hrs = Math.floor(sec / 3600)
    const mins = Math.floor((sec % 3600) / 60)
    const secs = Math.floor(sec % 60)
    const ms = Math.floor((sec % 1) * 1000)
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }

  const content = segments
    .map((seg, idx) => `${idx + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text}\n`)
    .join('\n')

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.srt`
  a.click()
  URL.revokeObjectURL(url)
}

