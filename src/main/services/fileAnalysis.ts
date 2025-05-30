import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import { dialog } from 'electron'
import { Word } from '../../common/types'
import { AnalysisService } from './analysis'
import { WordService } from './WordService'
import * as jschardet from 'jschardet'

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
          {
            name: 'Supported Files',
            extensions: [
              'docx',
              'xlsx',
              'xls',
              'pdf',
              'txt',
              'md',
              'log',
              'csv',
              'tsv',
              'json',
              'html',
              'htm',
              'xml'
            ]
          },
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
      } else if (fileExt === 'pdf') {
        text = await this.convertPdfToText(fileBuffer)
      } else {
        const detectedEncoding = jschardet.detect(fileBuffer)
        const encoding = detectedEncoding.encoding || 'utf-8'
        try {
          text = fileBuffer.toString(encoding as BufferEncoding)
        } catch {
          // エンコーディング検出失敗時はUTF-8でフォールバック
          text = fileBuffer.toString('utf-8')
        }
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

  private async convertPdfToText(fileBuffer: Buffer): Promise<string> {
    const data = await pdfParse(fileBuffer)
    return data.text.trim()
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
