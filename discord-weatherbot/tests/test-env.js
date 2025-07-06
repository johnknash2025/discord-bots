/**
 * discord-weatherbot 環境変数テスト
 */

import { config } from 'dotenv';
config();

console.log('🧪 discord-weatherbot 環境変数テスト開始...');

const requiredVars = [
  'DISCORD_PUBLIC_KEY',
  'DISCORD_BOT_TOKEN',
  'DISCORD_APPLICATION_ID',
  'GEMINI_API_KEY'
];

let allValid = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: 設定済み (${value.substring(0, 10)}...)`);
  } else {
    console.log(`❌ ${varName}: 未設定`);
    allValid = false;
  }
});

if (allValid) {
  console.log('🎉 すべての環境変数が設定されています！');
} else {
  console.log('⚠️  一部の環境変数が未設定です。.dev.vars ファイルを確認してください。');
  process.exit(1);
}
