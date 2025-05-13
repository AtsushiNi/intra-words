// 共通の型定義をここに集約

/**
 * 単語データの型定義
 */
export interface Word {
  id: number;
  text: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 設定データの型定義
 */
export interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
  language: string;
}
