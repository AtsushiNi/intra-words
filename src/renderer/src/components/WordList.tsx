import { useState } from 'react'
import { Input, List, Card, Tag, Typography } from 'antd'

const { Title } = Typography
const { Search } = Input

interface Word {
  id: string
  word: string
  definition: string
  category?: string
}

function WordList(): React.JSX.Element {
  const words: Word[] = [
    {
      id: '1',
      word: 'サンプル用語',
      definition: 'これはサンプルの用語説明です',
      category: '一般'
    }
  ]
  const [searchQuery, setSearchQuery] = useState('')

  const filteredWords = words.filter(
    (word) =>
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.definition.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        社内用語集
      </Title>
      <Search
        placeholder="用語を検索..."
        allowClear
        enterButton
        size="large"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '24px' }}
      />
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={filteredWords}
        renderItem={(word) => (
          <List.Item>
            <Card
              title={
                <>
                  {word.word}
                  {word.category && (
                    <Tag color="blue" style={{ marginLeft: '8px' }}>
                      {word.category}
                    </Tag>
                  )}
                </>
              }
            >
              {word.definition}
            </Card>
          </List.Item>
        )}
      />
    </div>
  )
}

export default WordList
