import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Word } from '../common/types'

// Custom APIs for renderer
const api = {
  getWords: () => ipcRenderer.invoke('get-words'),
  addWord: (word) => ipcRenderer.invoke('add-word', word),
  searchWords: (query) => ipcRenderer.invoke('search-words', query),
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
  analyzeText: (text: string) => ipcRenderer.invoke('analyze-text', text),
  addWords: (words: Word[]) => ipcRenderer.send('add-words', words),
  deleteWord: (id: number) => ipcRenderer.invoke('delete-word', id),
  updateWord: (word: Word) => ipcRenderer.invoke('update-word', word),
  addTag: (wordId: number, tagName: string) => ipcRenderer.invoke('add-tag', wordId, tagName)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
