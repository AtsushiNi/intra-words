import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import fs from 'fs'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

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
app.whenReady().then(() => {
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
  ;(async () => {
    db = await open({
      filename: join(app.getAppPath(), 'data/words.db'),
      driver: sqlite3.Database
    })
  })()

  // Config file operations
  const configPath = join(app.getAppPath(), 'config/config.json')

  ipcMain.handle('get-config', async () => {
    try {
      const data = fs.readFileSync(configPath, 'utf8')
      return JSON.parse(data)
    } catch {
      return { databasePath: join(app.getAppPath(), 'data/words.db') }
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

  // Database operations
  ipcMain.handle('get-words', async () => {
    return await db.all('SELECT * FROM words ORDER BY word')
  })

  ipcMain.handle('add-word', async (_, word) => {
    await db.run('INSERT INTO words (word, abbreviation, meaning, tags) VALUES (?, ?, ?, ?)', [
      word.word,
      word.abbreviation,
      word.meaning,
      word.tags
    ])
  })

  ipcMain.handle('search-words', async (_, query) => {
    return await db.all(
      `SELECT * FROM words 
     WHERE word LIKE ? OR abbreviation LIKE ? OR meaning LIKE ? OR tags LIKE ? 
     ORDER BY word`,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    )
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

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
