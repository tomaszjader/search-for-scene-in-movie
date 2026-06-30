import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import OpenAI from 'openai'
import { fetchTranscript } from 'youtube-transcript-plus'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const app = express()
const uploadDir = path.resolve('uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const supportedExtensions = new Set(['.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.oga', '.ogg', '.wav', '.webm'])
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
})
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const supported = supportedExtensions.has(extension)
    callback(supported ? null : new Error(`Nieobsługiwany format ${extension || '(brak rozszerzenia)'}. Wybierz MP4, MP3, WAV, M4A, WEBM, MPEG, OGG albo FLAC.`), supported)
  }
})
app.use(express.json({ limit: '10mb' }))

function youtubeId(value) {
  try {
    const url = new URL(value.trim())
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0]
    if (url.hostname.endsWith('youtube.com')) {
      if (url.pathname === '/watch') return url.searchParams.get('v')
      const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)
      return match?.[1] || null
    }
  } catch {}
  return null
}

function groupTranscript(items) {
  const groups = []
  let group = null
  for (const item of items) {
    const start = Number(item.offset) || 0
    const end = start + (Number(item.duration) || 0)
    if (!group || start - group.start >= 24 || group.text.length >= 420) {
      group = { id: groups.length + 1, start, end, text: item.text.trim() }
      groups.push(group)
    } else {
      group.end = Math.max(group.end, end)
      group.text += ` ${item.text.trim()}`
    }
  }
  return groups.filter(group => group.text)
}

app.post('/api/youtube', async (req, res) => {
  const videoId = youtubeId(req.body.url || '')
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return res.status(400).json({ error: 'Wklej prawidłowy link do filmu z YouTube.' })
  try {
    const result = await fetchTranscript(videoId, { videoDetails: true, retries: 2, retryDelay: 600 })
    const details = result.videoDetails || {}
    res.json({
      videoId,
      title: details.title || `Film YouTube (${videoId})`,
      author: details.author || 'YouTube',
      duration: Number(details.lengthSeconds) || 0,
      segments: groupTranscript(result.segments || [])
    })
  } catch (error) {
    const message = String(error?.message || '')
    const unavailable = /disabled|unavailable|transcript|caption/i.test(message)
    res.status(unavailable ? 422 : 502).json({ error: unavailable ? 'Ten film nie ma dostępnych napisów. Wybierz film z napisami automatycznymi lub dodanymi przez autora.' : 'Nie udało się pobrać napisów z YouTube. Spróbuj ponownie za chwilę.' })
  }
})

app.post('/api/transcribe', upload.single('video'), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Brak OPENAI_API_KEY. Skopiuj .env.example do .env.' })
  if (!req.file) return res.status(400).json({ error: 'Nie wybrano pliku.' })
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const result = await client.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path), model: 'whisper-1', response_format: 'verbose_json', timestamp_granularities: ['segment']
    })
    res.json({ segments: (result.segments || []).map((segment, index) => ({ id: index + 1, start: segment.start, end: segment.end, text: segment.text.trim() })) })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Nie udało się utworzyć transkrypcji.' })
  } finally { fs.unlink(req.file.path, () => {}) }
})

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Plik jest zbyt duży. Maksymalny rozmiar to 200 MB.' })
  if (error) return res.status(400).json({ error: error.message })
  next()
})

app.post('/api/search', async (req, res) => {
  const { query, segments } = req.body
  if (!query?.trim() || !Array.isArray(segments) || !segments.length) return res.status(400).json({ error: 'Brak pytania lub transkrypcji.' })
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Brak OPENAI_API_KEY.' })
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: `Wybierz maksymalnie 6 segmentów transkrypcji pasujących znaczeniowo do pytania. Zwróć wyłącznie JSON {"ids":[numery]} uporządkowany od najlepszego trafienia.\nPytanie: ${query}\nSegmenty: ${JSON.stringify(segments)}`
    })
    const parsed = JSON.parse(response.output_text.match(/\{[\s\S]*\}/)?.[0] || '{"ids":[]}')
    res.json({ ids: Array.isArray(parsed.ids) ? parsed.ids : [] })
  } catch (error) { res.status(500).json({ error: error.message || 'Wyszukiwanie nie powiodło się.' }) }
})

const dist = path.resolve('dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next())
}
app.listen(process.env.PORT || 8787, () => console.log(`API: http://localhost:${process.env.PORT || 8787}`))
