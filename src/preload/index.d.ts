import { ElectronAPI } from '@electron-toolkit/preload'
import { WordDefinition } from '../common/ai/deepseek'
import { Word, Config, Tag } from '../common/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getWords: () => Promise<Word[]>
      addWord: (word: Word) => Promise<void>
      searchWords: (params: { textQuery: string; tagNames: string[] }) => Promise<Word[]>
      getConfig: () => Promise<Config>
      updateConfig: (config: Config) => Promise<void>
      openDirectoryDialog: () => Promise<string>
      analyzeText: (text: string) => Promise<WordDefinition[]>
      analyzeFile: () => Promise<WordDefinition[]>
      addWords: (words: WordDefinition[]) => Promise<void>
      deleteWord: (id: number) => Promise<void>
      updateWord: (word: Word) => Promise<void>
      getTags: () => Promise<Tag[]>
      addTag: (wordId: number, tagName: string) => Promise<void>
      exportWords: (words: Word[]) => Promise<void>
      importWords: () => Promise<number>
      onFocusAnalyzeText: (callback: () => void) => () => void
      onStartAnalyzeText: (callback: (text) => Promise<void>) => () => void
      onFocusWordList: (callback: () => void) => () => void
      onStartSearchWords: (callback: (text) => Promise<void>) => () => void
    }
  }
}
