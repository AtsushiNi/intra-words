import * as XLSX from 'xlsx'
import * as fs from 'fs'
import { dialog } from 'electron'
import { Word } from '../../common/types'
import { AnalysisService } from './analysis'
import { WordService } from './WordService'

export class ExcelAnalysisService {
  private analysisService: AnalysisService

  constructor(wordService: WordService) {
    this.analysisService = new AnalysisService(wordService)
  }

  public async analyzeExcel(): Promise<Word[]> {
    let filePaths: string[] = []
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      if (result.canceled || !result.filePaths.length) {
        return []
      }
      filePaths = result.filePaths
      const fileBuffer = fs.readFileSync(filePaths[0])
      const text = this.convertExcelToText(fileBuffer)
      if (!text) throw new Error('Excelファイルから有効なデータを抽出できませんでした')
      return this.analysisService.analyzeText(text)
    } catch (error) {
      console.error('Excel解析エラー:', error)
      throw error
    }
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
