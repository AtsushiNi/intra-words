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

export interface Config {
  databaseFolder: string
}
