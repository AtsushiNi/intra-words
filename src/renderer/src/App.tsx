import { useState } from 'react'
import 'antd/dist/reset.css'
import { Layout, Button, ConfigProvider } from 'antd'
import WordList from './components/WordList'
import Settings from './components/Settings'
import { TextAnalysis } from './components/TextAnalysis'

const { Header, Content } = Layout

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<'wordList' | 'settings' | 'textAnalysis'>('wordList')

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
            onClick={() => setCurrentView(currentView === 'settings' ? 'wordList' : 'settings')}
            style={{ marginRight: '16px' }}
          >
            {currentView === 'settings' ? '単語リストに戻る' : '設定'}
          </Button>
          <Button
            type="primary"
            onClick={() => setCurrentView('textAnalysis')}
            style={{ marginRight: '16px' }}
          >
            テキスト解析
          </Button>
        </Header>
        <Content style={{ padding: '24px' }}>
          {currentView === 'settings' ? (
            <Settings />
          ) : currentView === 'textAnalysis' ? (
            <TextAnalysis onAddWords={() => setCurrentView('wordList')} />
          ) : (
            <WordList />
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
