import OpenAI from 'openai'
import { ApiHandler } from '..'
import { ApiConfiguration } from '../../../common/types'

export class DeepSeekHandler implements ApiHandler {
  private client: OpenAI

  constructor(configuration: ApiConfiguration) {
    this.client = new OpenAI({
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: configuration.apiKey || ''
    })
  }

  async ask(systemPrompt: string, message: string): Promise<string> {
    const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]

    const result = await this.client.chat.completions.create({
      messages: openAiMessages,
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      stream: false
    })
    const answer = result.choices[0].message.content
    return answer || ''
  }
}
