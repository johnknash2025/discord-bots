/**
 * Discord Slash Commands 登録スクリプト
 * discord-weatherbot
 */

import { config } from 'dotenv';
config();

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const commands = [
  {
    name: 'weather',
    description: '指定した場所の現在の天気を取得します',
    options: [
      {
        name: 'location',
        description: '都市名を入力してください（例: 東京, Tokyo, New York）',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'forecast',
    description: '指定した場所の天気予報を取得します',
    options: [
      {
        name: 'location',
        description: '都市名を入力してください',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'days',
        description: '予報日数を選択してください（1-5日）',
        type: 4, // INTEGER
        required: false,
        choices: [
          { name: '1日', value: 1 },
          { name: '2日', value: 2 },
          { name: '3日', value: 3 },
          { name: '4日', value: 4 },
          { name: '5日', value: 5 }
        ]
      }
    ],
  },
  {
    name: 'help',
    description: 'Weatherbotの使い方を表示します',
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
