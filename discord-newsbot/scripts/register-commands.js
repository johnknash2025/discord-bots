/**
 * Discord Slash Commands 登録スクリプト
 * discord-newsbot
 */

import { config } from 'dotenv';
config();

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const commands = [
  {
    name: 'analyze',
    description: 'ニュース配信 を実行します',
    options: [
      {
        name: 'input',
        description: '処理したい内容を入力してください',
        type: 3, // STRING
        required: true,
      },
    ],
  },
];

async function registerCommands() {
  try {
    console.log('🚀 Slash Commands を登録中...');
    
    const response = await fetch(
      `${DISCORD_API_BASE}/applications/${APPLICATION_ID}/commands`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      }
    );
    
    if (response.ok) {
      console.log('✅ Slash Commands の登録が完了しました！');
    } else {
      const error = await response.text();
      console.error('❌ 登録に失敗しました:', error);
    }
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

registerCommands();
