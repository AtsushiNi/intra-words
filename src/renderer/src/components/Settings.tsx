import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';

const Settings: React.FC = () => {
  const [dbPath, setDbPath] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadConfig = async (): Promise<void> => {
      try {
        const config = await ipcRenderer.invoke('get-config');
        setDbPath(config.databasePath);
      } catch (err) {
        console.error('設定の読み込みに失敗しました:', err);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (): Promise<void> => {
    try {
      await ipcRenderer.invoke('update-config', { databasePath: dbPath });
      setMessage('設定を保存しました');
    } catch {
      setMessage('設定の保存に失敗しました');
    }
  };

  return (
    <div className="settings-container">
      <h2>データベース設定</h2>
      <div>
        <label>
          データベースファイルパス:
          <input
            type="text"
            value={dbPath}
            onChange={(e) => setDbPath(e.target.value)}
          />
        </label>
      </div>
      <button onClick={handleSave}>保存</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Settings;
