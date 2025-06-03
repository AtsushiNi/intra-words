import React, { useEffect, useState } from 'react'
import { Form, Input, Button, Typography, message, Select } from 'antd'
import { ApiProvider } from 'src/common/types'

const { Title } = Typography
const { Option } = Select

const Settings: React.FC = () => {
  const [form] = Form.useForm()
  const [databaseFolder, setDatabaseFolder] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiProvider, setApiProvider] = useState<ApiProvider>('deepseek')
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const config = await window.api.getConfig()
        form.setFieldsValue({
          databaseFolder: config.databaseFolder,
          apiKey: config.apiConfiguration.apiKey || '',
          apiProvider: config.apiConfiguration.apiProvider || 'deepseek'
        })
        setDatabaseFolder(config.databaseFolder)
        setApiKey(config.apiConfiguration.apiKey || '')
        setApiProvider(config.apiConfiguration.apiProvider || 'deepseek')
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
      await window.api.updateConfig({
        databaseFolder: values.databaseFolder,
        apiConfiguration: {
          apiKey: values.apiKey,
          apiProvider: values.apiProvider
        }
      })
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
          <Form.Item
            name="apiProvider"
            label="AIプロバイダー"
            rules={[{ required: true, message: 'AIプロバイダーを選択してください' }]}
          >
            <Select
              value={apiProvider}
              onChange={(value) => {
                setApiProvider(value)
                form.setFieldsValue({ apiProvider: value })
              }}
            >
              <Option value="deepseek">DeepSeek</Option>
              <Option value="openai">OpenAI</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="apiKey"
            label={`${apiProvider === 'deepseek' ? 'DeepSeek' : 'OpenAI'} APIキー`}
            rules={[{ required: true, message: 'APIキーを入力してください' }]}
          >
            <Input.Password
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                form.setFieldsValue({ apiKey: e.target.value })
              }}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
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
