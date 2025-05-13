import { useState } from 'react'
import 'antd/dist/reset.css'
import { Layout, Button, ConfigProvider } from 'antd'
import WordList from './components/WordList'
import Settings from './components/Settings'

const { Header, Content } = Layout

function App(): React.JSX.Element {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff'
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ display: 'flex', alignItems: 'center', background: '#fff' }}>
          <Button
            type="primary"
            onClick={() => setShowSettings(!showSettings)}
            style={{ marginRight: '16px' }}
          >
            {showSettings ? '単語リストに戻る' : '設定'}
          </Button>
        </Header>
        <Content style={{ padding: '24px' }}>{showSettings ? <Settings /> : <WordList />}</Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
