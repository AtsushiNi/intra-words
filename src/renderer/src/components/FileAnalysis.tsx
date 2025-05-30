import { useState, ReactElement, useEffect } from 'react'
import { Word, Tag } from 'src/common/types'
import { Button, Typography, Form, Checkbox, Select, message, Input, Spin } from 'antd'

const { Title } = Typography

interface FileAnalysisProps {
  onAddWords: (words: Word[]) => void
}

export function FileAnalysis({ onAddWords }: FileAnalysisProps): ReactElement {
  const [messageApi, contextHolder] = message.useMessage()
  const [results, setResults] = useState<Word[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])

  useEffect(() => {
    const fetchTags = async (): Promise<void> => {
      try {
        const tags = await window.api.getTags()
        setAllTags(tags)
        await analyzeFile()
      } catch (error) {
        console.error('タグの取得に失敗しました:', error)
      }
    }
    fetchTags()
  }, [])

  useEffect(() => {
    setSelectedIndices(results.map((_, index) => index))
  }, [results])

  const analyzeFile = async (): Promise<void> => {
    setIsLoading(true)
    try {
      const results = await window.api.analyzeFile()
      setResults(results)
    } catch (error) {
      messageApi.error('ファイル解析に失敗しました')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = (): void => {
    try {
      const selectedWords = results.filter((_, index) => selectedIndices.includes(index))
      window.api.addWords(selectedWords)
      onAddWords(selectedWords)
      messageApi.success('単語を登録しました')
    } catch (error) {
      messageApi.error('単語登録に失敗しました')
      console.error(error)
    }
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        {isLoading ? (
          <Title level={4} style={{ marginBottom: '16px', textAlign: 'center' }}>
            ファイルを解析中...
          </Title>
        ) : (
          <Title level={4} style={{ marginBottom: '16px' }}>
            ファイル解析結果
          </Title>
        )}
        <Form layout="vertical" style={{ marginBottom: '24px' }}>
          {results.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px'
              }}
            >
              <Checkbox
                checked={selectedIndices.includes(index)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIndices([...selectedIndices, index])
                  } else {
                    setSelectedIndices(selectedIndices.filter((i) => i !== index))
                  }
                }}
              />
              <Form.Item style={{ flex: 1 }}>
                <Input placeholder="用語" value={item.text} readOnly />
              </Form.Item>
              <Form.Item style={{ flex: 2 }}>
                <Input.TextArea
                  placeholder="説明"
                  value={item.description}
                  readOnly
                  rows={3}
                  style={{ resize: 'none' }}
                />
              </Form.Item>
              <Form.Item style={{ flex: 1 }}>
                <Select
                  mode="tags"
                  placeholder="タグ"
                  value={item.tags?.map((t) => t.name) || []}
                  disabled
                  style={{ width: '100%' }}
                  options={allTags.map((tag) => ({
                    value: tag.name,
                    label: tag.name
                  }))}
                />
              </Form.Item>
            </div>
          ))}
        </Form>
        {isLoading ? (
          <Spin tip="ファイルを解析中..." size="large" style={{ display: 'block', margin: '0 auto' }} />
        ) : (
          <Button type="primary" onClick={handleConfirm} block>
            選択した単語を登録
          </Button>
        )}
      </div>
    </>
  )
}
