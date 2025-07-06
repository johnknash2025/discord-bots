/*
 * discord-weatherbot
 * 天気予報・気象情報 を行うDiscord Bot
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
    case 'weather':
      return await handleWeatherCommand(interaction, env);
    case 'forecast':
      return await handleForecastCommand(interaction, env);
    case 'help':
      return await handleHelpCommand(interaction, env);
    default:
      return new Response(JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '未知のコマンドです。`/help` でコマンド一覧を確認してください。' }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
  }
}

/**
 * /weather コマンドハンドラー
 */
async function handleWeatherCommand(interaction, env) {
  const options = interaction.data.options || [];
  const locationOption = options.find(opt => opt.name === 'location');
  
  if (!locationOption) {
    return new Response(JSON.stringify({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { 
        content: '❌ 場所を指定してください。\n例: `/weather location:東京` または `/weather location:Tokyo`' 
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = new Response(JSON.stringify({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  handleWeatherSearch(interaction, env, locationOption.value);
  
  return response;
}

/**
 * /forecast コマンドハンドラー
 */
async function handleForecastCommand(interaction, env) {
  const options = interaction.data.options || [];
  const locationOption = options.find(opt => opt.name === 'location');
  const daysOption = options.find(opt => opt.name === 'days');
  
  if (!locationOption) {
    return new Response(JSON.stringify({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { 
        content: '❌ 場所を指定してください。\n例: `/forecast location:大阪 days:3`' 
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = new Response(JSON.stringify({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  handleForecastSearch(interaction, env, locationOption.value, daysOption?.value || 3);
  
  return response;
}
