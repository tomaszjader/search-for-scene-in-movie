import 'dotenv/config'
import express from 'express'
import multer from 'multer'
import OpenAI from 'openai'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const app = express()
const uploadDir = path.resolve('uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const supportedExtensions = new Set(['.flac', '.m4a', '.mp3', '.mp4', '.mpeg', '.mpga', '.oga', '.ogg', '.wav', '.webm'])
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    callback(null, `${crypto.randomUUID()}${extension}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    callback(supportedExtensions.has(extension) ? null : new Error(`Nieobsługiwany format ${extension || '(brak rozszerzenia)'}. Wybierz MP4, MP3, WAV, M4A, WEBM, MPEG, OGG albo FLAC.`), supportedExtensions.has(extension))
  }
})
app.use(express.json({ limit: '10mb' }))

app.post('/api/transcribe', upload.single('video'), async (req, res) => {
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Brak OPENAI_API_KEY. Skopiuj .env.example do .env.' })
  if (!req.file) return res.status(400).json({ error: 'Nie wybrano pliku.' })
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const result = await client.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path), model: 'whisper-1', response_format: 'verbose_json', timestamp_granularities: ['segment']
    })
    res.json({ segments: (result.segments || []).map((s, i) => ({ id: i + 1, start: s.start, end: s.end, text: s.text.trim() })) })
  } catch (error) {
    res.status(500).json({ error: error.message || 'Nie udało się utworzyć transkrypcji.' })
  } finally { fs.unlink(req.file.path, () => {}) }
})

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Plik jest zbyt duży. Maksymalny rozmiar to 200 MB.' })
  }
  if (error) return res.status(400).json({ error: error.message })
  next()
})

app.post('/api/search', async (req, res) => {
  const { query, segments } = req.body
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Brak OPENAI_API_KEY.' })
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  try {
    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: `Wybierz maksymalnie 6 segmentów transkrypcji pasujących znaczeniowo do pytania. Zwróć wyłącznie JSON {"ids":[numery]} uporządkowany od najlepszego trafienia.\nPytanie: ${query}\nSegmenty: ${JSON.stringify(segments)}`
    })
    const parsed = JSON.parse(response.output_text.match(/\{[\s\S]*\}/)?.[0] || '{"ids":[]}')
    res.json({ ids: parsed.ids || [] })
  } catch (error) { res.status(500).json({ error: error.message || 'Wyszukiwanie nie powiodło się.' }) }
})

const dist = path.resolve('dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res, next) => req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next())
}
app.listen(process.env.PORT || 8787, () => console.log(`API: http://localhost:${process.env.PORT || 8787}`))
