#!/bin/bash

# discord-musicbot 環境変数デプロイスクリプト

echo "🚀 discord-musicbot の環境変数を設定中..."

# .dev.vars ファイルから環境変数を読み込み
if [ ! -f .dev.vars ]; then
    echo "❌ .dev.vars ファイルが見つかりません"
    exit 1
fi

source .dev.vars

# 環境変数をCloudflare Workersに設定
echo "DISCORD_PUBLIC_KEY を設定中..."
echo "$DISCORD_PUBLIC_KEY" | wrangler secret put DISCORD_PUBLIC_KEY

echo "DISCORD_BOT_TOKEN を設定中..."
echo "$DISCORD_BOT_TOKEN" | wrangler secret put DISCORD_BOT_TOKEN

echo "GEMINI_API_KEY を設定中..."
echo "$GEMINI_API_KEY" | wrangler secret put GEMINI_API_KEY

echo "✅ 環境変数の設定が完了しました！"
