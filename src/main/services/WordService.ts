import { open } from 'sqlite'
import { Word, Tag } from '../../common/types'

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
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )
    `)
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS word_tags (
        word_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (word_id, tag_id),
        FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `)
  }

  async getAllWords(): Promise<Word[]> {
    const words = await this.db.all(`
      SELECT w.*, 
             COALESCE(
               (SELECT json_group_array(json_object('id', t.id, 'name', t.name))
               FROM word_tags wt 
               JOIN tags t ON wt.tag_id = t.id
               WHERE wt.word_id = w.id
             ), '[]') as tags_json
      FROM words w
      ORDER BY w.text
    `)

    return words.map((word) => ({
      ...word,
      tags: word.tags_json ? JSON.parse(word.tags_json) : []
    }))
  }

  async addWord(word: Word): Promise<void> {
    await this.db.run('BEGIN TRANSACTION')
    try {
      // 単語の追加
      const result = await this.db.run(
        'INSERT INTO words (text, description, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        [word.text, word.description, new Date().toISOString(), new Date().toISOString()]
      )

      if (!result.lastID) {
        throw new Error('単語の追加に失敗しました')
      }

      // タグの追加
      if (word.tags && word.tags.length > 0) {
        for (const tag of word.tags) {
          await this.addTag(result.lastID, tag.name)
        }
      }

      await this.db.run('COMMIT')
    } catch (error) {
      await this.db.run('ROLLBACK')
      throw error
    }
  }

  async addWords(words: Word[]): Promise<void> {
    for (const word of words) {
      await this.addWord(word)
    }
  }

  async searchWords(query: string): Promise<Word[]> {
    const words = await this.db.all(
      `SELECT w.*, 
             COALESCE(
               (SELECT json_group_array(json_object('id', t.id, 'name', t.name))
               FROM word_tags wt 
               JOIN tags t ON wt.tag_id = t.id
               WHERE wt.word_id = w.id
             ), '[]') as tags_json
       FROM words w
       WHERE w.text LIKE ? OR w.description LIKE ?
       ORDER BY w.text`,
      [`%${query}%`, `%${query}%`]
    )

    return words.map((word) => ({
      ...word,
      tags: word.tags_json ? JSON.parse(word.tags_json) : []
    }))
  }

  async deleteWord(id: number): Promise<void> {
    await this.db.run('DELETE FROM words WHERE id = ?', [id])
  }

  async updateWord(word: Word): Promise<void> {
    if (!word.id) {
      throw new Error('単語IDが指定されていません')
    }

    await this.db.run('BEGIN TRANSACTION')
    try {
      // 単語情報の更新
      await this.db.run('UPDATE words SET text = ?, description = ?, updatedAt = ? WHERE id = ?', [
        word.text,
        word.description,
        new Date().toISOString(),
        word.id
      ])

      // 既存タグの削除
      await this.db.run('DELETE FROM word_tags WHERE word_id = ?', [word.id])

      // 新しいタグの追加
      if (word.tags && word.tags.length > 0) {
        for (const tag of word.tags) {
          await this.addTag(word.id, tag.name)
        }
      }

      await this.db.run('COMMIT')
    } catch (error) {
      await this.db.run('ROLLBACK')
      throw error
    }
  }

  async getAllTags(): Promise<Tag[]> {
    return await this.db.all('SELECT id, name FROM tags ORDER BY name')
  }

  async addTag(wordId: number, tagName: string): Promise<void> {
    await this.db.run('INSERT OR IGNORE INTO tags (name) VALUES (?)', [tagName])
    const tag = await this.db.get('SELECT id FROM tags WHERE name = ?', [tagName])
    await this.db.run('INSERT OR IGNORE INTO word_tags (word_id, tag_id) VALUES (?, ?)', [
      wordId,
      tag.id
    ])
  }

  async removeTag(wordId: number, tagId: number): Promise<void> {
    await this.db.run('DELETE FROM word_tags WHERE word_id = ? AND tag_id = ?', [wordId, tagId])
  }

  async getTagsByWord(wordId: number): Promise<{ id: number; name: string }[]> {
    return await this.db.all(
      `SELECT t.id, t.name FROM tags t
       JOIN word_tags wt ON t.id = wt.tag_id
       WHERE wt.word_id = ?`,
      [wordId]
    )
  }

  async searchByTag(tagName: string): Promise<Word[]> {
    return await this.db.all(
      `SELECT w.* FROM words w
       JOIN word_tags wt ON w.id = wt.word_id
       JOIN tags t ON wt.tag_id = t.id
       WHERE t.name LIKE ?
       ORDER BY w.text`,
      [`%${tagName}%`]
    )
  }
}
