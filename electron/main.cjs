const { app, BrowserWindow, ipcMain, shell } = require('electron')
const path = require('node:path')
const os = require('node:os')
const fs = require('node:fs/promises')
const { spawn } = require('node:child_process')
const ffmpegStatic = require('ffmpeg-static')
const youtubeDl = require('youtube-dl-exec')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)

const unpackedPath = binaryPath =>
  app.isPackaged ? binaryPath.replace('app.asar', 'app.asar.unpacked') : binaryPath

function runBinary(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true })
    let stderr = ''
    child.stderr.on('data', chunk => {
      stderr = (stderr + chunk.toString()).slice(-12000)
    })
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(stderr.trim() || `Proces zakończył się kodem ${code}.`))
    })
  })
}

function emitProgress(event, stage, message, current = 0, total = 0) {
  if (!event.sender.isDestroyed()) {
    event.sender.send('transcription:progress', { stage, message, current, total })
  }
}

async function transcribeAudio(filePath, apiKey, provider) {
  if (provider === 'local') {
    const transcriber = await loadLocalWhisper()
    const wav = await fs.readFile(filePath)
    const dataOffset = wav.indexOf(Buffer.from('data')) + 8
    if (dataOffset < 8) throw new Error('Nie udało się odczytać przygotowanego pliku WAV.')
    const samples = new Float32Array((wav.length - dataOffset) / 2)
    for (let i = 0; i < samples.length; i += 1) samples[i] = wav.readInt16LE(dataOffset + i * 2) / 32768
    return transcriber(samples, {
      language: 'polish',
      task: 'transcribe',
      return_timestamps: true,
      chunk_length_s: 30,
      stride_length_s: 5
    })
  }
  const endpoints = {
    openai: { url: 'https://api.openai.com/v1/audio/transcriptions', model: 'whisper-1' },
    groq: { url: 'https://api.groq.com/openai/v1/audio/transcriptions', model: 'whisper-large-v3-turbo' }
  }
  const config = endpoints[provider]
  if (!config) throw new Error('Transkrypcja YouTube w Electronie obsługuje OpenAI lub Groq.')

  const bytes = await fs.readFile(filePath)
  const form = new FormData()
  form.append('file', new Blob([bytes], { type: 'audio/wav' }), path.basename(filePath))
  form.append('model', config.model)
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'segment')

  const response = await fetch(config.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error?.message || `API transkrypcji zwróciło HTTP ${response.status}.`)
  }
  return response.json()
}

let localWhisper
let emitLocalModelStatus

async function removeIncompleteModelFiles(cacheDir) {
  const modelDir = path.join(cacheDir, 'onnx-community', 'whisper-small')
  const entries = await fs.readdir(modelDir, { recursive: true, withFileTypes: true }).catch(() => [])
  await Promise.all(
    entries
      .filter(entry => entry.isFile() && entry.name.includes('.tmp'))
      .map(entry => fs.rm(path.join(entry.parentPath || entry.path, entry.name), { force: true }))
  )
}

async function loadLocalWhisper() {
  if (localWhisper) return localWhisper
  const { pipeline, env } = await import('@huggingface/transformers')
  const cacheDir = path.join(app.getPath('userData'), 'models')
  env.cacheDir = cacheDir

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      emitLocalModelStatus?.(
        attempt === 1
          ? 'Pobieram lub ładuję lokalny model Whisper…'
          : `Ponawiam pobieranie modelu (${attempt}/3)…`
      )
      localWhisper = pipeline('automatic-speech-recognition', 'onnx-community/whisper-small', {
        dtype: 'q8',
        progress_callback: progress => {
          if (progress.status === 'progress' && Number.isFinite(progress.progress)) {
            emitLocalModelStatus?.(`Pobieram model Whisper: ${Math.round(progress.progress)}%`)
          } else if (progress.status === 'ready') {
            emitLocalModelStatus?.('Model lokalny jest gotowy.')
          }
        }
      })
      return await localWhisper
    } catch (error) {
      localWhisper = undefined
      await removeIncompleteModelFiles(cacheDir)
      if (attempt === 3) {
        throw new Error(
          `Nie udało się pobrać lokalnego modelu Whisper po 3 próbach. Sprawdź połączenie z internetem i spróbuj ponownie. Szczegóły: ${error.message}`
        )
      }
      await new Promise(resolve => setTimeout(resolve, attempt * 1500))
    }
  }
}

ipcMain.handle('transcription:youtube', async (event, options = {}) => {
  const { url, apiKey, provider = 'openai' } = options
  if (!/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url || '')) {
    throw new Error('Nieprawidłowy adres YouTube.')
  }
  if (provider !== 'local' && (!apiKey || typeof apiKey !== 'string')) {
    throw new Error('Brak klucza API do transkrypcji.')
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'framefinder-'))
  const sourcePath = path.join(tempDir, 'source.m4a')
  const chunkPattern = path.join(tempDir, 'chunk-%03d.wav')

  try {
    emitProgress(event, 'download', 'Pobieram ścieżkę audio z YouTube…')
    await runBinary(unpackedPath(youtubeDl.constants.YOUTUBE_DL_PATH), [
      '--no-playlist', '--no-warnings', '--format', 'bestaudio/best',
      '--output', sourcePath, url
    ])

    emitProgress(event, 'split', 'Przygotowuję audio do transkrypcji…')
    await runBinary(unpackedPath(ffmpegStatic), [
      '-hide_banner', '-loglevel', 'error', '-i', sourcePath,
      '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le',
      '-f', 'segment', '-segment_time', '600', '-reset_timestamps', '1', chunkPattern
    ])

    const chunks = (await fs.readdir(tempDir)).filter(name => /^chunk-\d+\.wav$/.test(name)).sort()
    if (!chunks.length) throw new Error('Nie udało się przygotować dźwięku do transkrypcji.')

    const segments = []
    for (let index = 0; index < chunks.length; index += 1) {
      emitProgress(event, 'transcribe', `Transkrybuję część ${index + 1} z ${chunks.length}…`, index + 1, chunks.length)
      emitLocalModelStatus = message => emitProgress(event, 'model', message, index + 1, chunks.length)
      const result = await transcribeAudio(path.join(tempDir, chunks[index]), apiKey?.trim() || '', provider)
      const offset = index * 600
      const apiSegments = result.segments?.length
        ? result.segments
        : result.chunks?.length
        ? result.chunks.map(chunk => ({ start: chunk.timestamp?.[0], end: chunk.timestamp?.[1], text: chunk.text }))
        : [{ start: 0, end: 600, text: result.text || '' }]
      for (const segment of apiSegments) {
        if (!segment.text?.trim()) continue
        segments.push({
          id: `desktop-${index}-${segments.length}`,
          start: Math.round((offset + Number(segment.start || 0)) * 10) / 10,
          end: Math.round((offset + Number(segment.end || segment.start || 0)) * 10) / 10,
          text: segment.text.trim()
        })
      }
    }

    if (!segments.length) throw new Error('API nie zwróciło żadnego tekstu transkrypcji.')
    emitProgress(event, 'done', 'Transkrypcja jest gotowa.', chunks.length, chunks.length)
    return { segments }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
})

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 680,
    backgroundColor: '#0b0b0d',
    show: false,
    icon: path.join(__dirname, '..', 'assets', 'framefinder.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url)
    return { action: 'deny' }
  })

  if (isDev) window.loadURL(process.env.VITE_DEV_SERVER_URL)
  else window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
