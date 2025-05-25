import { open } from 'sqlite'
import { Word } from '../../common/types'

export class WordService {
  private db: Awaited<ReturnType<typeof open>>

  constructor(db: Awaited<ReturnType<typeof open>>) {
    this.db = db
  }

  async initialize(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `)
  }

  async getAllWords(): Promise<Word[]> {
    return await this.db.all('SELECT * FROM words ORDER BY text')
  }

  async addWord(word: Word): Promise<void> {
    await this.db.run(
      'INSERT INTO words (text, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
      [word.text, word.description, new Date().toISOString(), new Date().toISOString()]
    )
  }

  async addWords(words: Word[]): Promise<void> {
    for (const word of words) {
      await this.addWord(word)
    }
  }

  async searchWords(query: string): Promise<Word[]> {
    return await this.db.all(
      `SELECT * FROM words
       WHERE text LIKE ? OR description LIKE ?
       ORDER BY text`,
      [`%${query}%`, `%${query}%`]
    )
  }
}
