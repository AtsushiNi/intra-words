import { app, safeStorage } from 'electron'
import { join } from 'path'
import fs from 'fs'
import { EventEmitter } from 'events'
import { Config } from '../../common/types'

export class ConfigService extends EventEmitter {
  private configPath: string
  private appConfig: Config

  constructor() {
    super()
    // 設定ファイルの配置場所
    this.configPath = join(app.getAppPath(), 'config/config.json')
    // 設定の初期値
    this.appConfig = {
      databaseFolder: join(app.getAppPath(), 'data'),
      apiConfiguration: {
        apiProvider: 'deepseek',
        apiKey: ''
      }
    }
  }

  public async initialize(): Promise<void> {
    await this.loadConfig()
  }

  public getConfig(): Config {
    return this.appConfig
  }

  public async loadConfig(): Promise<void> {
    try {
      // 設定ディレクトリが存在しない場合は作成
      const configDir = join(app.getAppPath(), 'config')
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true })
      }

      // 設定ファイルが存在しない場合はデフォルト設定で作成
      if (!fs.existsSync(this.configPath)) {
        fs.writeFileSync(this.configPath, JSON.stringify(this.appConfig, null, 2))
        return
      }

      const configData = fs.readFileSync(this.configPath, 'utf8')
      const savedConfig = JSON.parse(configData)

      if (savedConfig.apiConfiguration) {
        this.appConfig.apiConfiguration = {
          ...this.appConfig.apiConfiguration,
          ...savedConfig.apiConfiguration
        }
        if (savedConfig.apiConfiguration.encryptedApiKey) {
          this.appConfig.apiConfiguration.apiKey = this.decryptApiKey(
            savedConfig.apiConfiguration.encryptedApiKey
          )
        }
      }
      this.appConfig.databaseFolder = savedConfig.databaseFolder || join(app.getAppPath(), 'data')
    } catch (error) {
      console.error('設定ファイルの読み込みに失敗しました:', error)
      // エラー時もデフォルト設定でファイルを作成
      fs.writeFileSync(this.configPath, JSON.stringify(this.appConfig, null, 2))
    }
  }

  public async updateConfig(
    config: Partial<Config>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const configToSave = { ...config }

      if (config.apiConfiguration?.apiKey) {
        const newApiConfig = {
          ...this.appConfig.apiConfiguration, // 既存の設定を保持
          ...config.apiConfiguration, // 新しい設定をマージ
          encryptedApiKey: this.encryptApiKey(config.apiConfiguration.apiKey)
        }
        delete newApiConfig.apiKey
        configToSave.apiConfiguration = newApiConfig
        this.appConfig.apiConfiguration.apiKey = config.apiConfiguration.apiKey
      } else if (config.apiConfiguration) {
        configToSave.apiConfiguration = {
          ...this.appConfig.apiConfiguration,
          ...config.apiConfiguration
        }
      }

      if (config.databaseFolder) {
        this.appConfig.databaseFolder = config.databaseFolder
      }

      fs.writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2))
      this.emit('config-updated', this.appConfig)
      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private decryptApiKey(encryptedApiKey: string): string {
    if (!safeStorage.isEncryptionAvailable()) return ''
    try {
      return safeStorage.decryptString(Buffer.from(encryptedApiKey, 'base64'))
    } catch (error) {
      console.error('APIキーの復号化に失敗しました:', error)
      return ''
    }
  }

  private encryptApiKey(apiKey: string): string {
    if (!safeStorage.isEncryptionAvailable()) return ''
    return safeStorage.encryptString(apiKey).toString('base64')
  }
}
