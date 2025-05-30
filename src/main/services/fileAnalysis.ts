import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as mammoth from 'mammoth'
import { dialog } from 'electron'
import { Word } from '../../common/types'
import { AnalysisService } from './analysis'
import { WordService } from './WordService'

export class FileAnalysisService {
  private analysisService: AnalysisService

  constructor(wordService: WordService) {
    this.analysisService = new AnalysisService(wordService)
  }

  public async analyzeFile(): Promise<Word[]> {
    let filePaths: string[] = []
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Supported Files', extensions: ['docx', 'xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      if (result.canceled || !result.filePaths.length) {
        return []
      }
      filePaths = result.filePaths
      const fileBuffer = fs.readFileSync(filePaths[0])
      const fileExt = filePaths[0].split('.').pop()?.toLowerCase()

      let text: string
      if (fileExt === 'docx') {
        text = await this.convertWordToText(fileBuffer)
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        text = this.convertExcelToText(fileBuffer)
      } else {
        throw new Error('サポートされていないファイル形式です')
      }

      if (!text) throw new Error('ファイルから有効なデータを抽出できませんでした')
      return this.analysisService.analyzeText(text)
    } catch (error) {
      console.error('ファイル解析エラー:', error)
      throw error
    }
  }

  private async convertWordToText(fileBuffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer: fileBuffer })
    return result.value.trim()
  }

  private convertExcelToText(fileBuffer: Buffer): string {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    let text = ''
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' })
      jsonData.forEach((row) => (text += row.join('\t') + '\n'))
      text += '\n'
    })
    return text.trim()
  }
}
