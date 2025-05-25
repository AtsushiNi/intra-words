import { ApiHandler, buildApiHandler } from '../api'
import { Word } from '../../common/types'

export class AnalysisService {
  private readonly api: ApiHandler

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not defined in environment variables')
    }
    const apiConfiguration = {
      deepSeekApiKey: apiKey
    }
    this.api = buildApiHandler(apiConfiguration)
  }

  public async analyzeText(text: string): Promise<Word[]> {
    if (!text.trim()) {
      throw new Error('Input text cannot be empty')
    }

    console.log('Starting text analysis...')
    const systemPrompt =
      '与えられたテキストから重要な用語とその定義を抽出してください。JSON形式で{word: string, description: string}の配列をwordsという名前で返してください。'

    const resultText = await this.api.ask(systemPrompt, text)
    const result = JSON.parse(resultText)

    console.log('Analysis completed successfully')
    console.log(JSON.stringify(result, null, 2))

    return result.words.map((item: { word?: string; description?: string }) => ({
      text: item.word || '',
      description: item.description || ''
    })) as Word[]
  }
}
