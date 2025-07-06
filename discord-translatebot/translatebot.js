/*
 * discord-translatebot
 * 多言語翻訳 を行うDiscord Bot
 * 
 * Cloudflare Workers + Discord API + Gemini API
 */

import { verifyKey } from './utils/discord.js';

// Discord API設定
const DISCORD_API_BASE = 'https://discord.com/api/v10';

// レスポンスタイプ
const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
};

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Discord Interactions エンドポイント
      if (url.pathname === '/interactions' && request.method === 'POST') {
        return await handleInteraction(request, env);
      }
      
      // ヘルスチェック
      if (url.pathname === '/health') {
        return new Response('OK', { status: 200 });
      }
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

/**
 * Discord Interaction ハンドラー
 */
async function handleInteraction(request, env) {
  // リクエスト検証
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  
  if (!verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const interaction = JSON.parse(body);
  
  // PING応答
  if (interaction.type === 1) {
    return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // Slash Command処理
  if (interaction.type === 2) {
    return await handleSlashCommand(interaction, env);
  }
  
  return new Response('Unknown interaction type', { status: 400 });
}

/**
 * Slash Command ハンドラー
 */
async function handleSlashCommand(interaction, env) {
  const { data } = interaction;
  
  switch (data.name) {
    case 'analyze':
      return await handleAnalyzeCommand(interaction, env);
    default:
      return new Response(JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '未知のコマンドです。' }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
  }
}

/**
 * /analyze コマンドハンドラー
 */
async function handleAnalyzeCommand(interaction, env) {
  // 即座に応答（3秒制限対応）
  const response = new Response(JSON.stringify({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // バックグラウンドで処理実行
  // TODO: 実際の処理ロジックを実装
  
  return response;
}
