import { useState, ReactElement, useEffect, useRef } from 'react'
import { Word, Tag } from 'src/common/types'
import { Button, Input, Typography, Form, Checkbox, Select, message } from 'antd'

const { TextArea } = Input
const { Title } = Typography

interface TextAnalysisProps {
  onAddWords: (words: Word[]) => void
}

export function TextAnalysis({ onAddWords }: TextAnalysisProps): ReactElement {
  const [messageApi, contextHolder] = message.useMessage()
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState('')
  const [results, setResults] = useState<Word[]>([])
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [isForceAnalyze, setIsForceAnalyze] = useState(false)

  useEffect(() => {
    const handler = (text: string): Promise<void> => {
      setIsForceAnalyze(true)
      setText(text)
      return Promise.resolve()
    }
    return window.api.onStartAnalyzeText(handler)
  }, [])

  useEffect(() => {
    if (text && isForceAnalyze) {
      ;(async () => {
        try {
          await handleAnalyze()
        } catch (error) {
          console.error('解析処理中にエラーが発生しました:', error)
        } finally {
          setIsForceAnalyze(false)
        }
      })()
    }
  }, [isForceAnalyze])

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const fetchTags = async (): Promise<void> => {
      try {
        const tags = await window.api.getTags()
        setAllTags(tags)
      } catch (error) {
        console.error('タグの取得に失敗しました:', error)
      }
    }
    fetchTags()
  }, [])

  useEffect(() => {
    // 初期状態では全て選択
    setSelectedIndices(results.map((_, index) => index))
  }, [results])

  const handleAnalyze = async (): Promise<void> => {
    if (!text.trim()) {
      messageApi.error('テキストを入力してください')
      return
    }

    setIsLoading(true)

    try {
      const results = await window.api.analyzeText(text)
      setResults(results)
    } catch (err) {
      messageApi.error('解析に失敗しました')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = (): void => {
    try {
      window.api.addWords(results)
      onAddWords(results)
      setResults([])
      setText('')
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
        <Title level={2} style={{ marginBottom: '24px' }}>
          テキストから登録
        </Title>
        <TextArea
          ref={textAreaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="登録したい用語を含むテキストを入力してください"
          rows={5}
          style={{ marginBottom: '16px' }}
        />
        <Button
          type="primary"
          onClick={handleAnalyze}
          loading={isLoading}
          style={{ marginBottom: '24px' }}
        >
          解析する
        </Button>

        {results.length > 0 && (
          <div>
            <Title level={4} style={{ marginBottom: '16px' }}>
              解析結果
            </Title>
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
                    <Input
                      placeholder="用語"
                      value={item.text}
                      onChange={(e) => {
                        const newResults = [...results]
                        newResults[index].text = e.target.value
                        setResults(newResults)
                      }}
                    />
                  </Form.Item>
                  <Form.Item style={{ flex: 2 }}>
                    <Input.TextArea
                      placeholder="説明"
                      value={item.description}
                      onChange={(e) => {
                        const newResults = [...results]
                        newResults[index].description = e.target.value
                        setResults(newResults)
                      }}
                      rows={3}
                      style={{ resize: 'none' }}
                    />
                  </Form.Item>
                  <Form.Item style={{ flex: 1 }}>
                    <Select
                      mode="tags"
                      placeholder="タグ"
                      value={item.tags?.map((t) => t.name) || []}
                      onChange={(tagNames) => {
                        const newResults = [...results]
                        newResults[index].tags = tagNames.map((name) => ({ name }))
                        setResults(newResults)
                      }}
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
            <Button type="primary" onClick={handleConfirm} block>
              単語を登録
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
