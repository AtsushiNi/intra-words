import { DeepSeekHandler } from './providers/deepseek'

export interface ApiHandler {
  ask(systemPrompt: string, message: string): Promise<string>
}

export function buildApiHandler(configuration: ApiConfiguration): ApiHandler {
  const { apiProvider, ...options } = configuration
  switch (apiProvider) {
    case 'deepseek':
      return new DeepSeekHandler(options)
    default:
      return new DeepSeekHandler(options)
  }
}

export type ApiProvider = 'deepseek' | 'openai'

export interface ApiHandlerOptions {
  deepSeekApiKey?: string
}

export type ApiConfiguration = ApiHandlerOptions & {
  apiProvider?: ApiProvider
}