import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { BrowserWindow } from 'electron'
import { Word } from '../../common/types'
import { WordService } from './WordService'

export class HttpServerService {
  private app: express.Application
  private server?: ReturnType<express.Application['listen']>
  private wordService: WordService
  private mainWindow: BrowserWindow | null

  constructor(wordService: WordService, mainWindow: BrowserWindow | null) {
    this.wordService = wordService
    this.mainWindow = mainWindow
    this.app = express()
    this.setupServer()
  }

  private setupServer(): void {
    this.app.use(cors())
    this.app.use(bodyParser.json())

    // 単語登録API
    this.app.post('/api/words', async (req, res) => {
      try {
        const word = req.body as Word
        if (this.mainWindow) {
          this.mainWindow.show()
          this.mainWindow.focus()
          this.mainWindow.webContents.send('focus-analyze-text')
          this.mainWindow.webContents.send('start-analyze-text', word.text)
        }
        res.status(201).json({ success: true })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        res.status(500).json({ success: false, error: message })
      }
    })

    // 単語検索API
    this.app.get('/api/words', async (req, res) => {
      try {
        const query = (req.query.q as string) || ''
        if (this.mainWindow) {
          this.mainWindow.show()
          this.mainWindow.focus()
          this.mainWindow.webContents.send('focus-word-list')
          this.mainWindow.webContents.send('start-search-words', query)
        }
        const words = await this.wordService.searchWords({
          textQuery: query,
          tagNames: []
        })
        res.json(words)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        res.status(500).json({ success: false, error: message })
      }
    })
  }

  startServer(port = 54321): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`HTTP server running on port ${port}`)
        resolve()
      })
    })
  }

  stopServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve()
        return
      }

      this.server.close((err) => {
        if (err) {
          reject(err)
        } else {
          console.log('HTTP server stopped')
          resolve()
        }
      })
    })
  }
}
