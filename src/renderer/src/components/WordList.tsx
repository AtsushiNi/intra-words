import { useState, useEffect } from 'react'
import { Input, List, Card, Form, Button, message, Modal, FloatButton, Tag } from 'antd'
import { DeleteFilled, EditOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons'
import { Word } from '../../../common/types'

const { Search } = Input
const { Item } = Form

interface WordListProps {
  onNavigateToTextAnalysis: () => void
}

function WordList({ onNavigateToTextAnalysis }: WordListProps): React.JSX.Element {
  const [words, setWords] = useState<Word[]>([])
  const [deletingWord, setDeletingWord] = useState<Word | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredWords, setFilteredWords] = useState<Word[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isTagModalOpen, setIsTagModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const [form] = Form.useForm<Word>()

  const handleDeleteClick = (word: Word): void => {
    if (word.id === undefined) {
      message.error('単語IDが不正です')
      return
    }
    setDeletingWord(word)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteWord = async (): Promise<void> => {
    if (deletingWord?.id === undefined) {
      message.error('単語IDが不正です')
      return
    }
    try {
      await window.api.deleteWord(deletingWord.id)
      setWords((prevWords) => prevWords.filter((word) => word.id !== deletingWord.id))
      message.success('単語を削除しました')
      setIsDeleteModalOpen(false)
    } catch (err) {
      message.error('単語の削除に失敗しました')
      console.error(err)
    }
  }

  useEffect(() => {
    const fetchWords = async (): Promise<void> => {
      try {
        const words = await window.api.getWords()
        setWords(words)
      } catch (err) {
        message.error('単語の取得に失敗しました')
        console.error(err)
      }
    }
    fetchWords()
  }, [])

  useEffect(() => {
    const fetchSearchResults = async (): Promise<void> => {
      if (searchQuery.trim() === '') {
        setFilteredWords(words)
        return
      }
      try {
        const results = await window.api.searchWords(searchQuery)
        setFilteredWords(results)
      } catch (err) {
        message.error('検索に失敗しました')
        console.error(err)
      }
    }
    fetchSearchResults()
  }, [searchQuery, words])

  return (
    <div style={{ padding: '24px', overflow: 'hidden' }}>
      <Modal
        title="単語を削除しますか？"
        open={isDeleteModalOpen}
        onOk={handleDeleteWord}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText="削除"
        cancelText="キャンセル"
        okButtonProps={{ danger: true }}
      >
        <p>「{deletingWord?.text}」を削除しますか？この操作は元に戻せません。</p>
      </Modal>
      <FloatButton.Group
        style={{ right: 24, bottom: 24 }}
        trigger="click"
        type="primary"
        icon={<PlusOutlined />}
      >
        <FloatButton
          type="primary"
          className="word-add-button"
          description="用語を登録"
          onClick={() => setIsModalOpen(true)}
          style={{ width: 100, borderRadius: 8, marginRight: 60 }}
        />
        <FloatButton
          type="primary"
          className="word-add-button"
          description="テキストから登録"
          onClick={onNavigateToTextAnalysis}
          style={{ width: 120, borderRadius: 8, marginRight: 80 }}
        />
      </FloatButton.Group>
        <Search
        placeholder="用語を検索..."
        allowClear
        enterButton
        size="large"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onSearch={(value) => setSearchQuery(value)}
        style={{ marginBottom: '24px' }}
      />
      <Modal
        title="用語登録"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
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
              setWords(updatedWords)
              form.resetFields()
              setIsModalOpen(false)
              message.success('用語を登録しました')
            } catch (err) {
              message.error('用語の登録に失敗しました')
              console.error(err)
            }
          }}
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
      </Modal>

      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={filteredWords}
        renderItem={(word) => (
          <List.Item>
            <Card
              title={<>{word.text}</>}
              size="small"
              extra={
                <>
                  <Button
                    key={`edit-${word.id}`}
                    type="text"
                    onClick={() => {
                      setCurrentWord(word)
                      setIsEditModalOpen(true)
                    }}
                    icon={<EditOutlined />}
                  />
                  <Button
                    key={`delete-${word.id}`}
                    danger
                    type="text"
                    onClick={() => handleDeleteClick(word)}
                    icon={<DeleteFilled />}
                  />
                </>
              }
            >
              {word.description}
              <div style={{ marginTop: 8 }}>
                {word.tags?.map(tag => (
                  <Tag key={tag.id} icon={<TagOutlined />}>
                    {tag.name}
                  </Tag>
                ))}
                <Button 
                  size="small" 
                  type="dashed" 
                  icon={<PlusOutlined />}
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    setCurrentWord(word)
                    setIsTagModalOpen(true)
                  }}
                >
                  タグ追加
                </Button>
              </div>
            </Card>
          </List.Item>
        )}
        style={{
          height: 'calc(100vh - 230px)',
          overflow: 'auto',
          paddingRight: '8px'
        }}
      />

      <Modal
        title="タグを追加"
        open={isTagModalOpen}
        onOk={async () => {
          if (!currentWord?.id) return
          try {
            await window.api.addTag(currentWord.id, newTagName)
            const updatedWords = await window.api.getWords()
            setWords(updatedWords)
            setNewTagName('')
            setIsTagModalOpen(false)
            message.success('タグを追加しました')
          } catch (err) {
            message.error('タグの追加に失敗しました')
            console.error(err)
          }
        }}
        onCancel={() => {
          setNewTagName('')
          setIsTagModalOpen(false)
        }}
      >
        <Input
          placeholder="タグ名を入力"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
        />
      </Modal>

      <Modal
        title="用語編集"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <Form
          initialValues={currentWord || {}}
          layout="vertical"
          onFinish={async (values) => {
            if (!currentWord?.id) return
            try {
              await window.api.updateWord({
                ...currentWord,
                ...values
              })
              const updatedWords = await window.api.getWords()
              setWords(updatedWords)
              setIsEditModalOpen(false)
              message.success('用語を更新しました')
            } catch (err) {
              message.error('用語の更新に失敗しました')
              console.error(err)
            }
          }}
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
              更新
            </Button>
          </Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WordList
