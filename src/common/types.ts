export interface Word {
  id?: number
  text: string
  description: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Config {
  databaseFolder: string
}
