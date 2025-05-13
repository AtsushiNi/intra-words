import React, { useEffect } from 'react'
import { Form, Input, Button, Typography, message } from 'antd'

const { Title } = Typography

const Settings: React.FC = () => {
  const [form] = Form.useForm()

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const config = await window.api.getConfig()
        form.setFieldsValue({ databasePath: config.databasePath })
      } catch (err) {
        console.error('設定の読み込みに失敗しました:', err)
        message.error('設定の読み込みに失敗しました')
      }
    }
    loadConfig()
  }, [form])

  const handleSave = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      await window.api.updateConfig({ databasePath: values.databasePath })
      message.success('設定を保存しました')
    } catch (err) {
      message.error(`設定の保存に失敗しました: ${err}`)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        データベース設定
      </Title>
      <Form form={form} layout="vertical">
        <Form.Item
          name="databasePath"
          label="データベースファイルパス"
          rules={[{ required: true, message: 'データベースパスを入力してください' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSave}>
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default Settings
