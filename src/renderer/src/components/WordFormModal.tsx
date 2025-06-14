import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Modal, Select } from 'antd'
import { Word, Tag } from '../../../common/types'

interface FormValues extends Omit<Word, 'tags'> {
  tags?: string[]
}

const { Item } = Form

interface WordFormModalProps {
  open: boolean
  initialValues?: Word
  onSubmit: (values: Word) => Promise<void>
  onCancel: () => void
  title: string
  submitText: string
  loading?: boolean
}

export function WordFormModal({
  open,
  initialValues,
  onSubmit,
  onCancel,
  title,
  submitText,
  loading = false
}: WordFormModalProps): React.JSX.Element {
  const [form] = Form.useForm<FormValues>()
  const [allTags, setAllTags] = useState<Tag[]>([])

  useEffect(() => {
    const fetchTags = async (): Promise<void> => {
      try {
        const tags = await window.api.getTags()
        setAllTags(tags)
      } catch (error) {
        console.error('タグの取得に失敗しました:', error)
      }
    }
    if (open) {
      fetchTags()
    }
  }, [open])

  useEffect(() => {
    if (initialValues?.tags) {
      form.setFieldsValue({
        ...initialValues,
        tags: initialValues.tags.map((tag) => tag.name)
      })
    }
  }, [initialValues, form])

  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => {
        onCancel()
        form.resetFields()
      }}
      footer={null}
    >
      <Form
        form={form}
        initialValues={initialValues || {}}
        layout="vertical"
        onFinish={async (values) => {
          const tags = values.tags?.map((tagName) => {
            const existingTag = allTags.find((t) => t.name === tagName)
            return existingTag || { name: tagName }
          })
          await onSubmit({ ...values, tags })
          form.resetFields()
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
        <Item name="tags" label="タグ">
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="タグを入力"
            tokenSeparators={[',']}
            options={allTags.map((tag) => ({
              value: tag.name,
              label: tag.name
            }))}
          />
        </Item>
        <Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {submitText}
          </Button>
        </Item>
      </Form>
    </Modal>
  )
}
