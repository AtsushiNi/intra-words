import { useState, useEffect } from 'react'
import 'antd/dist/reset.css'
import { Layout, Button, ConfigProvider } from 'antd'
import { SettingOutlined, UnorderedListOutlined } from '@ant-design/icons'
import WordList from './components/WordList'
import Settings from './components/Settings'
import { TextAnalysis } from './components/TextAnalysis'
import { FileAnalysis } from './components/FileAnalysis'

const { Header, Content } = Layout

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<
    'wordList' | 'settings' | 'textAnalysis' | 'fileAnalysis'
  >('wordList')

  useEffect(() => {
    return window.api.onFocusWordList(() => setCurrentView('wordList'))
  }, [])
  useEffect(() => {
    return window.api.onFocusAnalyzeText(() => setCurrentView('textAnalysis'))
  }, [])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff'
        }
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Header
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#595959',
            padding: '0 24px',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginRight: 'auto'
            }}
          >
            Intra Words
          </div>
          <Button
            type="text"
            icon={
              currentView === 'settings' ? (
                <UnorderedListOutlined style={{ color: 'white', fontSize: '18px' }} />
              ) : (
                <SettingOutlined style={{ color: 'white', fontSize: '18px' }} />
              )
            }
            onClick={() => setCurrentView(currentView === 'wordList' ? 'settings' : 'wordList')}
            style={{ color: 'white' }}
          >
            {currentView === 'wordList' ? '' : '単語リストに戻る'}
          </Button>
        </Header>
        <Content style={{ padding: '24px' }}>
          {currentView === 'settings' ? (
            <Settings />
          ) : currentView === 'textAnalysis' ? (
            <TextAnalysis onAddWords={() => setCurrentView('wordList')} />
          ) : currentView === 'fileAnalysis' ? (
            <FileAnalysis onAddWords={() => setCurrentView('wordList')} />
          ) : (
            <WordList
              onNavigateToTextAnalysis={() => setCurrentView('textAnalysis')}
              onNavigateToFileAnalysis={() => setCurrentView('fileAnalysis')}
            />
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  )
}

export default App
