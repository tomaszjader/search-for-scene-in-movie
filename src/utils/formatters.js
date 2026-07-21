export const fmt = value =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`

export const queryWords = value =>
  value.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(word => word.length > 2) || []

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
