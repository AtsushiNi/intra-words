import { useState } from 'react'

interface Word {
  id: string
  word: string
  definition: string
  category?: string
}

function WordList(): React.JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [words, setWords] = useState<Word[]>([
    {
      id: '1',
      word: 'サンプル用語',
      definition: 'これはサンプルの用語説明です',
      category: '一般'
    }
  ])
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWords = words.filter(word =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.definition.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="word-list">
      <h2>社内用語集</h2>
      <input
        type="text"
        placeholder="用語を検索..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />
      <ul className="words">
        {filteredWords.map(word => (
          <li key={word.id} className="word-item">
            <h3>{word.word} {word.category && <span className="category">{word.category}</span>}</h3>
            <p>{word.definition}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default WordList
