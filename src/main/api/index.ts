import { ApiConfiguration } from '../../common/types'
import { DeepSeekHandler } from './providers/deepseek'

export interface ApiHandler {
  ask(systemPrompt: string, message: string): Promise<string>
}

export function buildApiHandler(configuration: ApiConfiguration): ApiHandler {
  switch (configuration.apiProvider) {
    case 'deepseek':
      return new DeepSeekHandler(configuration)
    default:
      return new DeepSeekHandler(configuration)
  }
}
