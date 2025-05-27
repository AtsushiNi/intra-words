import { useState, useEffect } from 'react'
import { WordFormModal } from './WordFormModal'
import { Input, List, Card, Button, Modal, FloatButton, Tag as AntdTag, message } from 'antd'
import { DeleteFilled, EditOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons'
import { Word, Tag } from '../../../common/types'

const { Search } = Input

interface WordListProps {
  onNavigateToTextAnalysis: () => void
}

function WordList({ onNavigateToTextAnalysis }: WordListProps): React.JSX.Element {
  const [messageApi, contextHolder] = message.useMessage()
  const [words, setWords] = useState<Word[]>([])
  const [deletingWord, setDeletingWord] = useState<Word | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [filteredWords, setFilteredWords] = useState<Word[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [currentWord, setCurrentWord] = useState<Word | undefined>(undefined)

  useEffect(() => {
    const fetchInitialData = async (): Promise<void> => {
      try {
        const [words, tags] = await Promise.all([window.api.getWords(), window.api.getTags()])
        setWords(words)
        setAllTags(tags)
      } catch (err) {
        messageApi.error('データの取得に失敗しました')
        console.error(err)
      }
    }
    fetchInitialData()
  }, [])

  useEffect(() => {
    const fetchSearchResults = async (): Promise<void> => {
      if (searchQuery.trim() === '' && selectedTags.length === 0) {
        setFilteredWords(words)
        return
      }
      try {
        const results = await window.api.searchWords({
          textQuery: searchQuery,
          tagNames: selectedTags.map((tag) => tag.name)
        })
        setFilteredWords(results)
      } catch (err) {
        messageApi.error('検索に失敗しました')
        console.error(err)
      }
    }
    fetchSearchResults()
  }, [searchQuery, selectedTags, words])

  const handleAddWordSubmit = async (values: Word): Promise<void> => {
    try {
      await window.api.addWord(values)
      const updatedWords = await window.api.getWords()
      setWords(updatedWords)
      setIsModalOpen(false)
      messageApi.success('用語を登録しました')
    } catch (err) {
      messageApi.error('用語の登録に失敗しました')
      console.error(err)
    }
  }

  const handleEditWordSubmit = async (values: Word): Promise<void> => {
    if (!currentWord?.id) return
    try {
      await window.api.updateWord({
        ...currentWord,
        ...values
      })
      const [updatedWords, updatedTags] = await Promise.all([
        window.api.getWords(),
        window.api.getTags()
      ])
      setWords(updatedWords)
      setAllTags(updatedTags)
      setIsEditModalOpen(false)
      messageApi.success('用語を更新しました')
    } catch (err) {
      messageApi.error('用語の更新に失敗しました')
      console.error(err)
    }
  }

  const handleDeleteClick = (word: Word): void => {
    if (word.id === undefined) {
      messageApi.error('単語IDが不正です')
      return
    }
    setDeletingWord(word)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteWord = async (): Promise<void> => {
    if (deletingWord?.id === undefined) {
      messageApi.error('単語IDが不正です')
      return
    }
    try {
      await window.api.deleteWord(deletingWord.id)
      setWords((prevWords) => prevWords.filter((word) => word.id !== deletingWord.id))
      messageApi.success('単語を削除しました')
      setIsDeleteModalOpen(false)
    } catch (err) {
      messageApi.error('単語の削除に失敗しました')
      console.error(err)
    }
  }

  const handleImportWords = async (): Promise<void> => {
    try {
      const importedCount = await window.api.importWords()
      messageApi.success(`${importedCount}件の用語をインポートしました`)
      const [updatedWords, updatedTags] = await Promise.all([
        window.api.getWords(),
        window.api.getTags()
      ])
      setWords(updatedWords)
      setAllTags(updatedTags)
    } catch (err) {
      messageApi.error('インポートに失敗しました')
      console.error(err)
    }
  }

  const handleExportWords = async (): Promise<void> => {
    try {
      await window.api.exportWords(filteredWords)
      messageApi.success('用語リストをエクスポートしました')
    } catch (err) {
      messageApi.error('エクスポートに失敗しました')
      console.error(err)
    }
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px', paddingTop: '0px', overflow: 'hidden' }}>
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
        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '15px' }}
        >
          <Button color="default" variant="dashed" onClick={handleImportWords}>
            import
          </Button>
          <Button color="default" variant="dashed" onClick={handleExportWords}>
            export
          </Button>
        </div>
        <div style={{ marginBottom: '24px' }}>
          <Search
            placeholder="用語を検索..."
            allowClear
            enterButton
            size="large"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={(value) => setSearchQuery(value)}
            style={{ marginBottom: '10px' }}
          />
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allTags.map((tag) => (
                <AntdTag.CheckableTag
                  key={tag.id}
                  checked={selectedTags.includes(tag)}
                  onChange={(checked) => {
                    setSelectedTags((prev) =>
                      checked ? [...prev, tag] : prev.filter((t) => t !== tag)
                    )
                  }}
                >
                  {tag.name}
                </AntdTag.CheckableTag>
              ))}
            </div>
          </div>
        </div>
        <WordFormModal
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          onSubmit={handleAddWordSubmit}
          title="用語登録"
          submitText="登録"
        />
        <WordFormModal
          open={isEditModalOpen}
          initialValues={currentWord}
          onCancel={() => setIsEditModalOpen(false)}
          onSubmit={handleEditWordSubmit}
          title="用語編集"
          submitText="更新"
        />
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={filteredWords}
          renderItem={(word) => (
            <List.Item>
              <Card
                title={<>{word.text}</>}
                size="small"
                bodyStyle={{ whiteSpace: 'pre-wrap' }}
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
                  {word.tags?.map((tag) => (
                    <AntdTag key={tag.id} icon={<TagOutlined />}>
                      {tag.name}
                    </AntdTag>
                  ))}
                </div>
              </Card>
            </List.Item>
          )}
          style={{
            height: 'calc(100vh - 280px)',
            overflow: 'auto',
            paddingRight: '8px'
          }}
        />
      </div>
    </>
  )
}

export default WordList
