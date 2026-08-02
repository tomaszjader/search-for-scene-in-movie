'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('frameFinderDesktop', {
  isElectron: true,
  transcribeYouTube: options => ipcRenderer.invoke('transcription:youtube', options),
  onTranscriptionProgress: callback => {
    const listener = (_event, progress) => callback(progress)
    ipcRenderer.on('transcription:progress', listener)
    return () => ipcRenderer.removeListener('transcription:progress', listener)
  }
})
