import { config } from 'dotenv'
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AnalysisService } from './services/analysis'
import { WordService } from './services/WordService'
import { Word } from '../common/types'

config()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Config file path
  const configPath = join(app.getAppPath(), 'config/config.json')

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Database setup
  let db
  async function initializeDB(): Promise<void> {
    try {
      const config = await (async () => {
        try {
          const data = fs.readFileSync(configPath, 'utf8')
          const config = JSON.parse(data)
          if (!config.databaseFolder) {
            throw new Error('databaseFolder not specified in config')
          }
          return config
        } catch {
          // Default to app data directory
          const defaultPath = app.getPath('appData')
          return { databaseFolder: defaultPath }
        }
      })()

      // Normalize path (expand ~ and resolve relative paths)
      const normalizePath = (path: string): string => {
        if (!path) {
          throw new Error('Database path is undefined')
        }
        if (path.startsWith('~')) {
          return join(app.getPath('home'), path.slice(1))
        }
        if (!path.startsWith('/')) {
          return join(app.getAppPath(), path)
        }
        return path
      }

      const normalizedDbPath = normalizePath(config.databaseFolder)
      const dbPath = join(normalizedDbPath, 'words.db')

      // Ensure directory exists with proper permissions
      try {
        if (!fs.existsSync(config.databaseFolder)) {
          fs.mkdirSync(config.databaseFolder, {
            recursive: true,
            mode: 0o755 // rwxr-xr-x
          })
        }

        // Test directory accessibility
        fs.accessSync(config.databaseFolder, fs.constants.R_OK | fs.constants.W_OK)

        db = await open({
          filename: dbPath,
          driver: sqlite3.Database,
          mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
        })
      } catch (error) {
        throw new Error(
          `Failed to initialize database folder at ${dbPath}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    } catch (error) {
      console.error('Database initialization failed:', error)
    }
  }

  // Initialize database
  await initializeDB()

  // Initialize services
  const analysisService = new AnalysisService()
  const wordService = new WordService(db)
  await wordService.initialize()

  // Text analysis IPC handlers
  ipcMain.handle('analyze-text', async (_, text: string) => {
    try {
      const results = await analysisService.analyzeText(text)
      return results
    } catch (error) {
      console.error('Text analysis failed:', error)
      throw error
    }
  })

  ipcMain.handle('get-config', async () => {
    try {
      const data = fs.readFileSync(configPath, 'utf8')
      return JSON.parse(data)
    } catch {
      return { databaseFolder: join(app.getAppPath(), 'data') }
    }
  })

  ipcMain.handle('update-config', async (_, config) => {
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
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

  ipcMain.handle('open-directory-dialog', async () => {
    const result = await dialog.showOpenDialog({
      title: 'データ保存先フォルダを選択',
      properties: ['openDirectory', 'createDirectory'],
      message: 'データベースファイルを保存するフォルダを選択してください'
    })
    return result.canceled ? null : result.filePaths[0]
  })

  createWindow()

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
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
