import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Word } from '../common/types'

// Custom APIs for renderer
const api = {
  getWords: () => ipcRenderer.invoke('get-words'),
  addWord: (word: Word) => ipcRenderer.invoke('add-word', word),
  searchWords: (params: { textQuery: string; tagNames: string[] }) =>
    ipcRenderer.invoke('search-words', params),
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
  analyzeText: (text: string) => ipcRenderer.invoke('analyze-text', text),
  analyzeFile: () => ipcRenderer.invoke('analyze-file'),
  addWords: (words: Word[]) => ipcRenderer.send('add-words', words),
  deleteWord: (id: number) => ipcRenderer.invoke('delete-word', id),
  updateWord: (word: Word) => ipcRenderer.invoke('update-word', word),
  getTags: () => ipcRenderer.invoke('get-tags'),
  addTag: (wordId: number, tagName: string) => ipcRenderer.invoke('add-tag', wordId, tagName),
  exportWords: (words: Word[]) => ipcRenderer.invoke('export-words', words),
  importWords: () => ipcRenderer.invoke('import-words'),
  onFocusAnalyzeText: (callback: () => void): (() => void) => {
    ipcRenderer.on('focus-analyze-text', callback)
    return () => ipcRenderer.off('focus-analyze-text', callback)
  },
  onStartAnalyzeText: (callback: (text: string) => void): (() => void) => {
    const func = (_event: IpcRendererEvent, text: string): void => callback(text)
    ipcRenderer.on('start-analyze-text', func)
    return () => ipcRenderer.off('start-analyze-text', func)
  },
  onFocusWordList: (callback: () => void): (() => void) => {
    ipcRenderer.on('focus-word-list', callback)
    return () => ipcRenderer.off('focus-word-list', callback)
  },
  onStartSearchWords: (callback: (text: string) => void): (() => void) => {
    const func = (_event: IpcRendererEvent, text: string): void => callback(text)
    ipcRenderer.on('start-search-words', func)
    return () => ipcRenderer.off('start-search-words', func)
  }
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
