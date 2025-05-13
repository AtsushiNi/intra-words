import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Typography, message } from 'antd'

const { Title } = Typography

const Settings: React.FC = () => {
  const [form] = Form.useForm()
  const [databaseFolder, setDatabaseFolder] = useState('')
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const config = await window.api.getConfig()
        form.setFieldsValue({ databaseFolder: config.databaseFolder })
        setDatabaseFolder(config.databaseFolder)
      } catch (err) {
        console.error('設定の読み込みに失敗しました:', err)
        messageApi.error('設定の読み込みに失敗しました')
      }
    }
    loadConfig()
  }, [form])

  const handleSave = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      await window.api.updateConfig({ databaseFolder: values.databaseFolder })
      messageApi.success('設定を保存しました')
    } catch (err) {
      messageApi.error(`設定の保存に失敗しました: ${err}`)
    }
  }

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>
          データベース設定
        </Title>
        <Form form={form} layout="vertical">
          <Form.Item
            name="databaseFolder"
            label="データ保存先フォルダ"
            rules={[{ required: true, message: 'データ保存先フォルダを入力してください' }]}
          >
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 120px)' }}
                value={databaseFolder}
                onChange={(e) => {
                  setDatabaseFolder(e.target.value)
                  form.setFieldsValue({ databaseFolder: e.target.value })
                }}
              />
              <Button
                onClick={async () => {
                  const path = await window.api.openDirectoryDialog()
                  if (path) {
                    setDatabaseFolder(path)
                    form.setFieldsValue({ databaseFolder: path })
                  }
                }}
              >
                フォルダ選択
              </Button>
            </Input.Group>
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  )
}

export default Settings
