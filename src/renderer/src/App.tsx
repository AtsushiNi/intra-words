import { useState } from 'react'
import WordList from './components/WordList'
import Settings from './components/Settings'

function App(): React.JSX.Element {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="app-container">
      <div className="header">
        <button className="settings-button" onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? '単語リストに戻る' : '設定'}
        </button>
      </div>
      {showSettings ? <Settings /> : <WordList />}
    </div>
  )
}

export default App
