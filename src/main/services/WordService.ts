import { open } from 'sqlite'
import Fuse from 'fuse.js'
import moji from 'moji'
import TinySegmenter from 'tiny-segmenter'
import kuromoji from 'kuromoji'
import { Word, Tag } from '../../common/types'
import { join } from 'path'
import fs from 'fs'
import sqlite3 from 'sqlite3'

const segmenter = new TinySegmenter()
let kuromojiTokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>

// kuromoji辞書の初期化
kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
  if (err) {
    console.error('kuromojiの初期化に失敗しました:', err)
  } else {
    kuromojiTokenizer = tokenizer
  }
})

function _tokenize(text: string, tokenizer: string): string[] {
  if (tokenizer === 'trigram') {
    return text.match(/.{1,3}/g) || []
  } else if (tokenizer === 'kuromoji' && kuromojiTokenizer) {
    // 表層形と読みの両方を返す
    return kuromojiTokenizer
      .tokenize(text)
      .flatMap((t) => [t.surface_form, ...(t.reading ? [t.reading] : [])])
  } else {
    return segmenter.segment(text)
  }
}

function tokenize(text: string, tokenizer: string): string[] {
  const query = moji(text)
    .convert('HK', 'ZK')
    .convert('ZS', 'HS')
    .convert('ZE', 'HE')
    .toString()
    .trim()

  return _tokenize(query, tokenizer)
    .map((word) => {
      if (word !== ' ') {
        // kuromojiのreadingがあればそれを使い、なければsurface_formをひらがなに変換
        if (kuromojiTokenizer && tokenizer === 'kuromoji') {
          const tokens = kuromojiTokenizer.tokenize(word)
          if (tokens.length > 0 && tokens[0].reading) {
            return tokens[0].reading.toLowerCase()
          }
        }
        return moji(word).convert('KK', 'HG').toString().toLowerCase()
      }
      return ''
    })
    .filter((v) => v)
}

function encode(text: string): string {
  // ひらがなに変換してからエンコード
  const hiraganaText = kuromojiTokenizer
    ? kuromojiTokenizer
        .tokenize(text)
        .map((t) => t.reading || t.surface_form)
        .join('')
    : text

  return moji(hiraganaText)
    .convert('HK', 'ZK')
    .convert('ZS', 'HS')
    .convert('ZE', 'HE')
    .convert('HG', 'KK')
    .toString()
    .trim()
    .toLowerCase()
}

export class WordService {
  private db: Awaited<ReturnType<typeof open>>
  private fuse?: Fuse<Word>

  constructor(db: Awaited<ReturnType<typeof open>>) {
    this.db = db
  }

  async updateDatabase(newDb: Awaited<ReturnType<typeof open>>): Promise<void> {
    this.db = newDb
    this.fuse = undefined // 検索インデックスをリセット
  }

  static async initializeDatabase(
    databaseFolder: string,
    options: { skipSchemaInit?: boolean } = {}
  ): Promise<{ db: Awaited<ReturnType<typeof open>>; service?: WordService }> {
    let db
    try {
      const dbPath = join(databaseFolder, 'words.db')

      // Ensure directory exists with proper permissions
      if (!fs.existsSync(databaseFolder)) {
        fs.mkdirSync(databaseFolder, {
          recursive: true,
          mode: 0o755 // rwxr-xr-x
        })
      }

      // Test directory accessibility
      fs.accessSync(databaseFolder, fs.constants.R_OK | fs.constants.W_OK)

      db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
      })

      if (options.skipSchemaInit) {
        return { db }
      }

      // Initialize schema
      await db.exec(`
        CREATE TABLE IF NOT EXISTS words (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          description TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        )
      `)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE
        )
      `)
      await db.exec(`
        CREATE TABLE IF NOT EXISTS word_tags (
          word_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          PRIMARY KEY (word_id, tag_id),
          FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        )
      `)

      const service = new WordService(db)
      return { db, service }
    } catch (error) {
      console.error('Database initialization failed:', error)
      throw error
    }
  }

  async getAllWords(): Promise<Word[]> {
    const words = await this.db.all(`
      SELECT w.*
      FROM words w
      ORDER BY w.text
    `)

    // 各単語のタグを取得
    for (const word of words) {
      word.tags = await this.getTagsByWord(word.id)
    }

    // Wordインターフェースに含まれるプロパティのみを返す
    return words.map(word => ({
      id: word.id,
      text: word.text,
      description: word.description,
      tags: word.tags,
      createdAt: word.createdAt,
      updatedAt: word.updatedAt
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

  private async buildSearchIndex(): Promise<void> {
    const words = await this.getAllWords()
    const processedWords = words.map((word) => ({
      ...word,
      search_text: encode(word.text),
      search_description: encode(word.description),
      tokenized_text: tokenize(word.text, 'kuromoji'),
      tokenized_description: tokenize(word.description, 'kuromoji')
    }))
    console.log(processedWords)

    this.fuse = new Fuse(processedWords, {
      keys: [
        'text',
        'description',
        'search_text',
        'search_description',
        'tokenized_text',
        'tokenized_description'
      ],
      includeScore: true,
      threshold: 0.4,
      ignoreLocation: true,
      shouldSort: true
    })
  }

  private async filterByTags(tagNames: string[]): Promise<Word[]> {
    if (tagNames.length === 0) {
      return await this.getAllWords()
    }

    const query = `
      SELECT DISTINCT w.*
      FROM words w
      WHERE w.id IN (
        SELECT wt.word_id FROM word_tags wt
        JOIN tags t ON wt.tag_id = t.id
        WHERE ${tagNames.map(() => 't.name = ?').join(' OR ')}
      )
      ORDER BY w.text
    `

    const words = await this.db.all(query, tagNames)

    // 各単語のタグを取得
    for (const word of words) {
      const tags = await this.getTagsByWord(word.id)
      word.tags = tags.map((tag) => ({ name: tag.name }))
    }

    // Wordインターフェースに含まれるプロパティのみを返す
    return words.map(word => ({
      id: word.id,
      text: word.text,
      description: word.description,
      tags: word.tags,
      createdAt: word.createdAt,
      updatedAt: word.updatedAt
    }))
  }

  async searchWords(params: { textQuery: string; tagNames: string[] }): Promise<Word[]> {
    // タグでフィルタリング
    let words = await this.filterByTags(params.tagNames)

    // テキスト検索
    if (params.textQuery.trim() !== '') {
      if (!this.fuse) await this.buildSearchIndex()
      const results = this.fuse!.search(params.textQuery)
      const searchedWords = results.map((r) => r.item)

      // タグフィルタリング結果とテキスト検索結果の積集合を取る
      if (params.tagNames.length > 0) {
        const wordIds = new Set(words.map((w) => w.id))
        words = searchedWords.filter((w) => wordIds.has(w.id))
      } else {
        words = searchedWords
      }
    }

    // Wordインターフェースに含まれるプロパティのみを返す
    return words.map(word => ({
      id: word.id,
      text: word.text,
      description: word.description,
      tags: word.tags,
      createdAt: word.createdAt,
      updatedAt: word.updatedAt
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
      // 更新前のタグを取得
      const oldTags = await this.getTagsByWord(word.id)

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

      // 更新で削除されたタグのみをクリーンアップ
      const removedTags = oldTags.filter(
        (oldTag) => !word.tags?.some((t) => t.name === oldTag.name)
      )
      for (const removedTag of removedTags) {
        // 他の単語で使われていないか確認
        const usageCount = await this.db.get(
          'SELECT COUNT(*) as count FROM word_tags WHERE tag_id = ?',
          [removedTag.id]
        )
        if (usageCount.count === 0) {
          await this.db.run('DELETE FROM tags WHERE id = ?', [removedTag.id])
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
