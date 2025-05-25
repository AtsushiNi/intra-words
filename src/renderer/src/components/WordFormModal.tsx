import React from 'react'
import { Form, Input, Button, Modal } from 'antd'
import { Word } from '../../../common/types'

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
  const [form] = Form.useForm<Word>()

  return (
    <Modal title={title} open={open} onCancel={onCancel} footer={null} destroyOnClose
    >
      <Form
        form={form}
        initialValues={initialValues || {}}
        layout="vertical"
        onFinish={onSubmit}
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
          <Button type="primary" htmlType="submit" loading={loading}>
            {submitText}
          </Button>
        </Item>
      </Form>
    </Modal>
  )
}
