import { useState, useEffect } from 'react'
import { Input, List, Card, Typography, Form, Button, message } from 'antd'
import { Word } from '../../../common/types'

const { Title } = Typography
const { Search } = Input
const { Item } = Form

function WordList(): React.JSX.Element {
  const [words, setWords] = useState<Word[]>([])

  useEffect(() => {
    const fetchWords = async (): Promise<void> => {
      try {
        const words = await window.api.getWords()
        setWords(
          words.map((w) => ({
            text: w.text,
            description: w.description,
            id: w.id,
            createdAt: w.createdAt,
            updatedAt: w.updatedAt
          }))
        )
      } catch (err) {
        message.error('単語の取得に失敗しました')
        console.error(err)
      }
    }
    fetchWords()
  }, [])
  const [searchQuery, setSearchQuery] = useState('')
  const [form] = Form.useForm<Word>()

  const filteredWords = words.filter(
    (word) =>
      word.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.description.toLowerCase().includes(searchQuery.toLowerCase())
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
      <Form
        form={form}
        layout="vertical"
        onFinish={async (values) => {
          try {
            await window.api.addWord({
              text: values.text,
              description: values.description
            })
            const updatedWords = await window.api.getWords()
            setWords(
              updatedWords.map((w) => ({
                text: w.text,
                description: w.description,
                id: w.id,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt
              }))
            )
            form.resetFields()
            message.success('用語を登録しました')
          } catch (err) {
            message.error('用語の登録に失敗しました')
            console.error(err)
          }
        }}
        style={{ marginBottom: '24px' }}
      >
        <Item
          name="text"
          label="用語"
          rules={[{ required: true, message: '用語を入力してください' }]}
        >
          <Input placeholder="用語を入力" />
        </Item>
        <Item
          name="description"
          label="説明"
          rules={[{ required: true, message: '説明を入力してください' }]}
        >
          <Input.TextArea placeholder="説明を入力" rows={4} />
        </Item>
        <Item name="abbreviation" label="略称">
          <Input placeholder="略称を入力（任意）" />
        </Item>
        <Item name="category" label="カテゴリ">
          <Input placeholder="カテゴリを入力（任意）" />
        </Item>
        <Item>
          <Button type="primary" htmlType="submit">
            登録
          </Button>
        </Item>
      </Form>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={filteredWords}
        renderItem={(word) => (
          <List.Item>
            <Card title={<>{word.text}</>}>{word.description}</Card>
          </List.Item>
        )}
      />
    </div>
  )
}

export default WordList
