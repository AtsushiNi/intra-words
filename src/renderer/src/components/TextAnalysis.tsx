import { useState, ReactElement } from 'react';
import { Word } from 'src/common/types';

interface TextAnalysisProps {
  onAddWords: (words: Word[]) => void;
}

export function TextAnalysis({ onAddWords }: TextAnalysisProps): ReactElement {
  const [text, setText] = useState('');
  const [results, setResults] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (): Promise<void> => {
    if (!text.trim()) {
      setError('テキストを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const results = await window.api.analyzeText(text);
      setResults(results);
      console.log(results)
    } catch (err) {
      setError('解析に失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = (): void => {
    try {
      window.api.addWords(results);
      onAddWords(results);
      setResults([]);
      setText('');
    } catch (error) {
      console.error('単語登録に失敗しました:', error);
    }
  };

  return (
    <div className="text-analysis">
      <h2>テキスト解析</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="解析したいテキストを入力してください"
        rows={5}
      />
      <button onClick={handleAnalyze} disabled={isLoading}>
        {isLoading ? '解析中...' : '解析する'}
      </button>
      {error && <div className="error">{error}</div>}

      {results.length > 0 && (
        <div className="results">
          <h3>解析結果</h3>
          <ul>
            {results.map((item, index) => (
              <li key={index}>
                <strong>{item.text}</strong>: {item.description}
              </li>
            ))}
          </ul>
          <button onClick={handleConfirm}>単語を登録</button>
        </div>
      )}
    </div>
  );
}
