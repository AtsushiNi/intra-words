# intra-words

社内用語・専門用語を蓄積する単語集アプリ

- 以下のソースからAIを使って単語やその説明・タグを自動抽出
    - テキスト入力
    - ファイル入力(Word, Excel, PDF, テキストファイル)
- 形態素解析を用いたあいまい検索

## 技術スタック

- **フロントエンド**: React 19, Ant Design
- **バックエンド**: Electron
- **言語**: TypeScript
- **テキスト処理**: Kuromoji, TinySegmenter
- **AI統合**: Anthropic, OpenAI
- **データベース**: SQLite
- **ビルドツール**: Vite, electron-builder

## ディレクトリ構成

```
intra-words/
├── src/
│   ├── main/          # Electronメインプロセス
│   ├── renderer/      # Reactフロントエンド
│   ├── preload/       # Electronプリロードスクリプト
│   └── common/        # 共通タイプ定義
├── build/             # ビルド設定ファイル
├── resources/         # アプリケーションリソース
└── docs/              # ドキュメント
```

## API仕様

### 単語登録API
`POST /api/words`

- リクエストボディ:
```json
{
  "text": "単語テキスト",
  "description": "単語の説明",
  "tags": [
    {"name": "タグ1"},
    {"name": "タグ2"}
  ]
}
```

- 成功レスポンス (201 Created):
```json
{
  "success": true
}
```

### 単語検索API
`GET /api/words?q=検索文字列`

- クエリパラメータ:
  - `q`: 検索文字列 (任意)

- 成功レスポンス (200 OK):
```json
[
  {
    "id": 1,
    "text": "単語テキスト",
    "description": "単語の説明",
    "tags": [
      {"name": "タグ1"},
      {"name": "タグ2"}
    ],
    "createdAt": "2025-05-30T15:00:00.000Z",
    "updatedAt": "2025-05-30T15:00:00.000Z"
  }
]
```

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
