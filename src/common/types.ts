export interface Tag {
  id?: number
  name: string
}

export interface Word {
  id?: number
  text: string
  description: string
  tags?: Tag[]
  createdAt?: Date
  updatedAt?: Date
}

export type ApiProvider = 'deepseek' | 'openai'

export interface ApiConfiguration {
  apiProvider: ApiProvider
  apiKey?: string
}

export interface Config {
  databaseFolder: string
  apiConfiguration: ApiConfiguration
}
