import { ApiHandler, buildApiHandler } from '../api'
import { Word } from '../../common/types'
import { WordService } from './WordService'

export class AnalysisService {
  private readonly api: ApiHandler
  private readonly wordService: WordService

  constructor(wordService: WordService) {
    this.wordService = wordService
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
    const allTags = await this.wordService.getAllTags()
    const tagList = allTags.map((t) => t.name).join(', ')

    const systemPrompt = `与えられたテキストから、用語集に登録すべき重要な用語とその説明を抽出し、適切なタグを付与してください。
利用可能なタグ: ${tagList}

以下のJSON形式で返してください:
{
  "words": [
    {
      "word": "抽出した用語",
      "description": "用語の説明", 
      "tags": ["適切なタグ1", "適切なタグ2"]
    }
  ]
}

注意点:
- 与えられたテキストと同じ言語で内容を記述すること
- 説明の。の直後には改行コードを入れること
- 用語の正式名称・略語・別名などを説明に含めても構わない
- 専門用語のうちあなたが知っているものがあれ知っているものがあれば、適宜説明を加えても構わない
- タグは利用可能なタグから選択すること
- 一般的ではない用語にのみ"社内用語"タグをつけること
- タグは必ずしも必要ではない`

    const resultText = await this.api.ask(systemPrompt, text)
    const result = JSON.parse(resultText)

    const words = result.words.map(
      (item: { word?: string; description?: string; tags?: string[] }) => {
        const wordText = item.word || ''
        const description = item.description || ''
        const tagNames = item.tags || []

        // タグ名からTagオブジェクトを取得
        const matchedTags = allTags.filter((tag) => tagNames.includes(tag.name))

        return {
          text: wordText,
          description,
          tags: matchedTags.length > 0 ? matchedTags : undefined
        }
      }
    ) as Word[]

    console.log('Analysis completed successfully')
    console.log(JSON.stringify(words, null, 2))

    return words
  }
}
