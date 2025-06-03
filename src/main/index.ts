import { config } from 'dotenv'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { ConfigService } from './services/ConfigService'
import { join } from 'path'
import fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AnalysisService } from './services/analysis'
import { WordService } from './services/WordService'
import { FileAnalysisService } from './services/fileAnalysis'
import { HttpServerService } from './services/HttpServerService'
import { Word } from '../common/types'

let wordService: WordService
let httpServerService: HttpServerService
let configService: ConfigService
let mainWindow: BrowserWindow

config()

function createWindow(): BrowserWindow {
  // Create the browser window.
  const window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Create main window first
  mainWindow = createWindow()

  // Initialize ConfigService first
  configService = new ConfigService()
  await configService.initialize()
  const config = configService.getConfig()

  // Database setup
  const { db, service } = await WordService.initializeDatabase(config.databaseFolder)
  wordService = service || new WordService(db)
  await wordService.updateDatabase(db)

  // Config change listener
  configService.on('config-updated', async (newConfig) => {
    // Update services with new config
    analysisService.updateConfig(newConfig.apiConfiguration)
    fileAnalysisService.updateConfig(newConfig.apiConfiguration)

    // Reinitialize database if folder changed
    try {
      const { db: newDb } = await WordService.initializeDatabase(newConfig.databaseFolder)
      await wordService.updateDatabase(newDb)
    } catch (error) {
      console.error('Failed to update database:', error)
    }
  })

  // Initialize services
  const analysisService = new AnalysisService(wordService, config.apiConfiguration)
  const fileAnalysisService = new FileAnalysisService(wordService, config.apiConfiguration)

  // Initialize and start HTTP server
  httpServerService = new HttpServerService(wordService, mainWindow)
  try {
    await httpServerService.startServer()
  } catch (error) {
    console.error('Failed to start HTTP server:', error)
  }

  // Text analysis IPC handlers
  ipcMain.handle('analyze-text', async (_, text: string) => {
    try {
      return await analysisService.analyzeText(text)
    } catch (error) {
      console.error('Text analysis failed:', error)
      throw error
    }
  })

  ipcMain.handle('analyze-file', async () => {
    try {
      return await fileAnalysisService.analyzeFile()
    } catch (error) {
      console.error('File analysis failed:', error)
      throw error
    }
  })

  ipcMain.handle('get-config', async () => {
    return configService.getConfig()
  })

  ipcMain.handle('update-config', async (_, config) => {
    return configService.updateConfig(config)
  })

  // Word operations
  ipcMain.handle('get-words', async () => {
    return wordService.getAllWords()
  })

  ipcMain.handle('add-word', async (_, word: Word) => {
    await wordService.addWord(word)
  })

  ipcMain.on('add-words', async (_, words: Word[]) => {
    await wordService.addWords(words)
  })

  ipcMain.handle('search-words', async (_, query) => {
    return wordService.searchWords(query)
  })

  ipcMain.handle('delete-word', async (_, id: number) => {
    await wordService.deleteWord(id)
  })

  ipcMain.handle('update-word', async (_, word: Word) => {
    await wordService.updateWord(word)
  })

  ipcMain.handle('get-tags', async () => {
    return wordService.getAllTags()
  })

  ipcMain.handle('add-tag', async (_, wordId: number, tagName: string) => {
    await wordService.addTag(wordId, tagName)
  })

  ipcMain.handle('export-words', async (_, words: Word[]) => {
    try {
      const filteredWords = words.map((word) => ({
        text: word.text,
        description: word.description,
        tags: word.tags?.map((tag) => ({ name: tag.name }))
      }))
      const jsonData = JSON.stringify(filteredWords, null, 2)
      const { filePath } = await dialog.showSaveDialog({
        title: '用語リストをエクスポート',
        defaultPath: `words_${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }]
      })
      if (filePath) {
        fs.writeFileSync(filePath, jsonData)
        return { success: true, path: filePath }
      }
      return { success: false }
    } catch (error) {
      console.error('Export failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  ipcMain.handle('import-words', async () => {
    try {
      const { filePaths, canceled } = await dialog.showOpenDialog({
        title: 'インポートするJSONファイルを選択',
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })

      if (canceled || !filePaths[0]) {
        return 0
      }

      const filePath = filePaths[0]
      const data = fs.readFileSync(filePath, 'utf8')
      const words: Word[] = JSON.parse(data)

      if (!Array.isArray(words)) {
        throw new Error('Invalid format: Expected array of words')
      }

      await wordService.addWords(words)
      return words.length
    } catch (error) {
      console.error('Import failed:', error)
      return 0
    }
  })

  ipcMain.handle('open-directory-dialog', async () => {
    const result = await dialog.showOpenDialog({
      title: 'データ保存先フォルダを選択',
      properties: ['openDirectory', 'createDirectory'],
      message: 'データベースファイルを保存するフォルダを選択してください'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    httpServerService.stopServer().finally(() => {
      app.quit()
    })
  }
})

app.on('will-quit', () => {
  httpServerService.stopServer().catch((error) => {
    console.error('Failed to stop HTTP server:', error)
  })
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
