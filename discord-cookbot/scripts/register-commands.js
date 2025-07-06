/**
 * Discord Slash Commands 登録スクリプト
 * discord-cookbot
 */

import { config } from 'dotenv';
config();

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

const commands = [
  {
    name: 'analyze',
    description: '料理のレシピや栄養情報を分析します',
    options: [
      {
        name: 'input',
        description: '料理名を入力してください（例: カレー、パスタ、寿司）',
        type: 3, // STRING
        required: false,
      },
      {
        name: 'image',
        description: '料理の画像をアップロードしてください',
        type: 11, // ATTACHMENT
        required: false,
      },
    ],
  },
  {
    name: 'recipe',
    description: '特定の料理のレシピを検索します',
    options: [
      {
        name: 'dish',
        description: '作りたい料理名を入力してください',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'difficulty',
        description: '難易度を選択してください',
        type: 3, // STRING
        required: false,
        choices: [
          { name: '簡単', value: 'easy' },
          { name: '普通', value: 'medium' },
          { name: '難しい', value: 'hard' }
        ]
      }
    ],
  },
  {
    name: 'nutrition',
    description: '食材や料理の栄養情報を調べます',
    options: [
      {
        name: 'food',
        description: '調べたい食材や料理名を入力してください',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'help',
    description: 'Cookbotの使い方を表示します',
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
