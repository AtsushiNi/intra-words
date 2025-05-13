import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getWords: () => Promise<Word[]>
      addWord: (word: Word) => Promise<void>
      searchWords: (query: string) => Promise<Word[]>
      getConfig: () => Promise<Config>
      updateConfig: (config: Config) => Promise<void>
      openDirectoryDialog: () => Promise<string>
    }
  }
}
