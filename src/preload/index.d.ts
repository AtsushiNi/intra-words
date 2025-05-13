import { ElectronAPI } from '@electron-toolkit/preload'

interface Word {
  id?: number
  word: string
  abbreviation?: string
  meaning: string
  tags?: string
}

interface Config {
  databasePath: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getWords: () => Promise<Word[]>
      addWord: (word: Word) => Promise<void>
      searchWords: (query: string) => Promise<Word[]>
      getConfig: () => Promise<Config>
      updateConfig: (config: Config) => Promise<void>
    }
  }
}
