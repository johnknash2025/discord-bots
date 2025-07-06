# 🤖 discord-mathbot

数学計算・グラフ描画 を行うDiscord Bot

## ✨ 機能

- 🔍 **数学計算・グラフ描画**: 高精度な処理
- 💬 **Discord統合**: Slash Commandで簡単操作
- 🔄 **自動返信**: 処理結果をスレッドに自動投稿
- ☁️ **24/7稼働**: Cloudflare Workersで常時稼働

## 🚀 使用方法

1. Discordサーバーで `/analyze` コマンドを実行
2. 必要な情報を入力
3. 数秒後にスレッドに詳細な結果が投稿される

## 🛠️ セットアップ

### 必要な環境

- Node.js 18+
- Cloudflare Workers アカウント
- Discord Developer アカウント
- Google AI Studio アカウント（Gemini API）

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .dev.vars.example .dev.vars
```

### 3. Slash Command の登録

```bash
node scripts/register-commands.js
```

### 4. ローカル開発

```bash
npm run start
```

### 5. 本番デプロイ

```bash
npm run deploy
```

## 📁 プロジェクト構造

```
discord-mathbot/
├── mathbot.js        # メインWorkerファイル
├── package.json            # 依存関係設定
├── wrangler.toml           # Cloudflare Workers設定
├── .dev.vars.example       # 環境変数テンプレート
├── docs/                   # ドキュメント
├── scripts/               # ユーティリティスクリプト
├── tests/                 # テストファイル
└── configs/               # 設定ファイル
```

## 🔧 技術スタック

- **Runtime**: Cloudflare Workers
- **Language**: JavaScript (ES Modules)
- **AI API**: Google Gemini API
- **Platform**: Discord API v10
- **Deployment**: Wrangler CLI

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照
