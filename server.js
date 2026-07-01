import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import OpenAI from 'openai'
import { fetchTranscript } from 'youtube-transcript-plus'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import youtubeDl from 'youtube-dl-exec'
import ffmpegPath from 'ffmpeg-static'

const app = express()
const execFileAsync = promisify(execFile)
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

async function transcribeYoutube(videoId) {
  if (!process.env.OPENAI_API_KEY) throw new Error('Brak OPENAI_API_KEY potrzebnego do transkrypcji filmu bez napisów.')
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const jobDir = await fs.promises.mkdtemp(path.join(uploadDir, 'youtube-'))
  try {
    const details = await youtubeDl(url, { dumpSingleJson: true, skipDownload: true, noPlaylist: true, noWarnings: true })
    const maxDuration = Number(process.env.YOUTUBE_MAX_DURATION_SECONDS) || 4 * 60 * 60
    if (Number(details.duration) > maxDuration) throw new Error(`Film jest za długi. Maksymalna długość to ${Math.floor(maxDuration / 3600)} godz.`)

    await youtubeDl(url, {
      output: path.join(jobDir, 'source.%(ext)s'),
      format: 'worstaudio[ext=m4a]/worstaudio[ext=webm]/worstaudio',
      noPlaylist: true,
      noWarnings: true
    })
    const sourceName = (await fs.promises.readdir(jobDir)).find(name => name.startsWith('source.'))
    if (!sourceName) throw new Error('Nie udało się pobrać ścieżki audio z YouTube.')

    await execFileAsync(ffmpegPath, [
      '-hide_banner', '-loglevel', 'error', '-i', path.join(jobDir, sourceName),
      '-vn', '-ac', '1', '-ar', '16000', '-b:a', '48k', '-f', 'segment',
      '-segment_time', '1200', '-reset_timestamps', '1', path.join(jobDir, 'chunk-%03d.mp3')
    ])

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const chunks = (await fs.promises.readdir(jobDir)).filter(name => /^chunk-\d+\.mp3$/.test(name)).sort()
    const segments = []
    for (const [chunkIndex, chunkName] of chunks.entries()) {
      const result = await client.audio.transcriptions.create({
        file: fs.createReadStream(path.join(jobDir, chunkName)), model: 'whisper-1',
        response_format: 'verbose_json', timestamp_granularities: ['segment']
      })
      const offset = chunkIndex * 1200
      for (const segment of result.segments || []) {
        const text = segment.text.trim()
        if (text) segments.push({ id: segments.length + 1, start: offset + segment.start, end: offset + segment.end, text })
      }
    }
    return {
      videoId, title: details.title || `Film YouTube (${videoId})`,
      author: details.uploader || details.channel || 'YouTube',
      duration: Number(details.duration) || 0, segments, transcriptSource: 'audio'
    }
  } finally {
    await fs.promises.rm(jobDir, { recursive: true, force: true })
  }
}

app.post('/api/youtube', async (req, res) => {
  const videoId = youtubeId(req.body.url || '')
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return res.status(400).json({ error: 'Wklej prawidłowy link do filmu z YouTube.' })
  try {
    const result = await fetchTranscript(videoId, { videoDetails: true, retries: 2, retryDelay: 600 })
    const details = result.videoDetails || {}
    const segments = groupTranscript(result.segments || [])
    if (!segments.length) throw new Error('YouTube nie zwrócił napisów.')
    res.json({
      videoId,
      title: details.title || `Film YouTube (${videoId})`,
      author: details.author || 'YouTube',
      duration: Number(details.lengthSeconds) || 0,
      segments,
      transcriptSource: 'captions'
    })
  } catch {
    try {
      res.json(await transcribeYoutube(videoId))
    } catch (error) {
      res.status(502).json({ error: error.message || 'Nie udało się pobrać ani przetranskrybować filmu z YouTube.' })
    }
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
