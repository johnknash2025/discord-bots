/*
 * discord-cookbot
 * 料理レシピ・栄養情報 を行うDiscord Bot
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
    case 'recipe':
      return await handleRecipeCommand(interaction, env);
    case 'nutrition':
      return await handleNutritionCommand(interaction, env);
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
 * /analyze コマンドハンドラー
 */
async function handleAnalyzeCommand(interaction, env) {
  const options = interaction.data.options || [];
  const inputOption = options.find(opt => opt.name === 'input');
  const imageOption = options.find(opt => opt.name === 'image');
  
  if (!inputOption && !imageOption) {
    return new Response(JSON.stringify({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { 
        content: '❌ 料理名または画像を指定してください。\n例: `/analyze input:カレー` または画像をアップロード' 
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 即座に応答（3秒制限対応）
  const response = new Response(JSON.stringify({
    type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  // バックグラウンドで処理実行
  handleCookingAnalysis(interaction, env, inputOption?.value, imageOption);
  
  return response;
}

/**
 * 料理分析処理（バックグラウンド実行）
 */
async function handleCookingAnalysis(interaction, env, recipeInput, imageAttachment) {
  try {
    let analysisResult;
    
    if (imageAttachment) {
      // 画像解析
      analysisResult = await analyzeRecipeImage(imageAttachment.url, env);
    } else if (recipeInput) {
      // テキスト解析
      analysisResult = await analyzeRecipeText(recipeInput, env);
    }
    
    // フォローアップメッセージを送信
    await sendFollowupMessage(interaction, env, analysisResult);
    
  } catch (error) {
    console.error('Analysis error:', error);
    await sendFollowupMessage(interaction, env, {
      error: true,
      message: '申し訳ございません。分析中にエラーが発生しました。もう一度お試しください。'
    });
  }
}

/**
 * 料理画像解析
 */
async function analyzeRecipeImage(imageUrl, env) {
  const prompt = `この料理の画像を分析して、以下の情報を日本語で提供してください：

1. 料理名
2. 主な材料（推定）
3. 調理方法の概要
4. 推定カロリー（1人前）
5. 栄養価の特徴
6. おすすめの付け合わせ
7. 調理のコツ

画像から読み取れる情報を基に、実用的で詳細な分析をお願いします。`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: await getImageAsBase64(imageUrl)
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      return {
        success: true,
        analysis: data.candidates[0].content.parts[0].text,
        type: 'image'
      };
    } else {
      throw new Error('No analysis result from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      error: 'AI分析サービスに接続できませんでした。'
    };
  }
}

/**
 * 料理テキスト解析
 */
async function analyzeRecipeText(recipeName, env) {
  const prompt = `「${recipeName}」について、以下の情報を詳しく日本語で教えてください：

🍽️ **料理情報**
- 料理の特徴と由来
- 主な材料とその栄養価
- 基本的な調理手順

📊 **栄養情報**
- 推定カロリー（1人前）
- 主要な栄養素（タンパク質、炭水化物、脂質、ビタミン、ミネラル）
- 健康への効果

👨‍🍳 **調理のコツ**
- 美味しく作るポイント
- よくある失敗と対策
- アレンジ方法

🥗 **おすすめ組み合わせ**
- 相性の良い付け合わせ
- 飲み物の提案

実用的で分かりやすい情報をお願いします。`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      return {
        success: true,
        analysis: data.candidates[0].content.parts[0].text,
        type: 'text',
        recipeName: recipeName
      };
    } else {
      throw new Error('No analysis result from Gemini API');
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      error: 'AI分析サービスに接続できませんでした。'
    };
  }
}

/**
 * 画像をBase64に変換
 */
async function getImageAsBase64(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return base64;
  } catch (error) {
    console.error('Image fetch error:', error);
    throw new Error('画像の取得に失敗しました');
  }
}

/**
 * フォローアップメッセージ送信
 */
async function sendFollowupMessage(interaction, env, result) {
  const webhookUrl = `${DISCORD_API_BASE}/webhooks/${interaction.application_id}/${interaction.token}`;
  
  let content;
  
  if (result.error) {
    content = `❌ **エラー**\n${result.message || result.error}`;
  } else if (result.success) {
    const emoji = result.type === 'image' ? '📸' : '🍽️';
    const title = result.type === 'image' ? '料理画像分析結果' : `${result.recipeName} の詳細情報`;
    
    content = `${emoji} **${title}**\n\n${result.analysis}\n\n---\n*🤖 Cookbot - 料理分析AI*`;
  } else {
    content = '❌ 分析結果を取得できませんでした。';
  }

  // メッセージが2000文字を超える場合は分割
  if (content.length > 2000) {
    const parts = splitMessage(content, 2000);
    for (let i = 0; i < parts.length; i++) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: parts[i] + (i === parts.length - 1 ? '' : '\n*(続く...)*')
        })
      });
      
      // レート制限対策
      if (i < parts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } else {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content })
    });
  }
}

/**
 * メッセージを指定文字数で分割
 */
function splitMessage(text, maxLength) {
  const parts = [];
  let currentPart = '';
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (currentPart.length + line.length + 1 <= maxLength) {
      currentPart += (currentPart ? '\n' : '') + line;
    } else {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = line;
      } else {
        // 1行が長すぎる場合は強制分割
        let remaining = line;
        while (remaining.length > maxLength) {
          parts.push(remaining.substring(0, maxLength));
          remaining = remaining.substring(maxLength);
        }
        currentPart = remaining;
      }
    }
  }
  
  if (currentPart) {
    parts.push(currentPart);
  }
  
  return parts;
}

/**
 * /recipe コマンドハンドラー
 */
async function handleRecipeCommand(interaction, env) {
  const options = interaction.data.options || [];
  const dishOption = options.find(opt => opt.name === 'dish');
  const difficultyOption = options.find(opt => opt.name === 'difficulty');
  
  if (!dishOption) {
    return new Response(JSON.stringify({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { 
        content: '❌ 料理名を指定してください。\n例: `/recipe dish:オムライス`' 
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
  
  handleRecipeSearch(interaction, env, dishOption.value, difficultyOption?.value);
  
  return response;
}

/**
 * /nutrition コマンドハンドラー
 */
async function handleNutritionCommand(interaction, env) {
  const options = interaction.data.options || [];
  const foodOption = options.find(opt => opt.name === 'food');
  
  if (!foodOption) {
    return new Response(JSON.stringify({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { 
        content: '❌ 食材名を指定してください。\n例: `/nutrition food:トマト`' 
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
  
  handleNutritionSearch(interaction, env, foodOption.value);
  
  return response;
}

/**
 * /help コマンドハンドラー
 */
async function handleHelpCommand(interaction, env) {
  const helpMessage = `🍽️ **Cookbot - 料理分析AI**

**利用可能なコマンド:**

🔍 \`/analyze\` - 料理の分析
• \`input:\` 料理名で検索
• \`image:\` 料理画像をアップロード

📖 \`/recipe\` - レシピ検索
• \`dish:\` 料理名（必須）
• \`difficulty:\` 難易度（簡単/普通/難しい）

📊 \`/nutrition\` - 栄養情報
• \`food:\` 食材や料理名

❓ \`/help\` - このヘルプを表示

**使用例:**
• \`/analyze input:カレー\`
• \`/recipe dish:オムライス difficulty:簡単\`
• \`/nutrition food:トマト\`

**機能:**
✅ 料理画像の自動分析
✅ 詳細なレシピ提供
✅ 栄養価計算
✅ 調理のコツとアドバイス
✅ 食材の組み合わせ提案

*🤖 Powered by Gemini AI*`;

  return new Response(JSON.stringify({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: helpMessage }
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * レシピ検索処理
 */
async function handleRecipeSearch(interaction, env, dishName, difficulty) {
  try {
    const difficultyText = difficulty ? 
      (difficulty === 'easy' ? '簡単な' : 
       difficulty === 'medium' ? '普通の' : '本格的な') : '';
    
    const prompt = `「${dishName}」の${difficultyText}レシピを詳しく教えてください：

📝 **レシピ情報**
- 材料（分量付き、○人前）
- 調理時間
- 難易度

👨‍🍳 **調理手順**
1. 下準備
2. 詳細な調理ステップ（番号付き）
3. 仕上げのポイント

💡 **コツとポイント**
- 美味しく作るコツ
- 失敗しないための注意点
- 時短テクニック

🔄 **アレンジ方法**
- 材料の代用案
- 味のバリエーション

📊 **栄養情報**
- 推定カロリー
- 主要栄養素

実用的で分かりやすいレシピをお願いします。`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1500,
        }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      const result = {
        success: true,
        analysis: data.candidates[0].content.parts[0].text,
        type: 'recipe',
        recipeName: dishName
      };
      await sendFollowupMessage(interaction, env, result);
    } else {
      throw new Error('No recipe result from Gemini API');
    }
  } catch (error) {
    console.error('Recipe search error:', error);
    await sendFollowupMessage(interaction, env, {
      error: true,
      message: 'レシピの検索中にエラーが発生しました。もう一度お試しください。'
    });
  }
}

/**
 * 栄養情報検索処理
 */
async function handleNutritionSearch(interaction, env, foodName) {
  try {
    const prompt = `「${foodName}」の栄養情報を詳しく教えてください：

📊 **基本栄養情報（100gあたり）**
- カロリー
- タンパク質
- 炭水化物
- 脂質
- 食物繊維
- 糖質

🧪 **ビタミン・ミネラル**
- 主要なビタミン（A, B群, C, D, E, K）
- 主要なミネラル（鉄, カルシウム, マグネシウム, 亜鉛など）

💪 **健康効果**
- 期待できる健康効果
- 美容効果
- 注意すべき点

🍽️ **摂取のポイント**
- 効果的な食べ方
- 組み合わせると良い食材
- 1日の推奨摂取量

🛒 **選び方・保存方法**
- 新鮮な${foodName}の見分け方
- 保存方法と期間

科学的で実用的な情報をお願いします。`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + env.GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1200,
        }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      const result = {
        success: true,
        analysis: data.candidates[0].content.parts[0].text,
        type: 'nutrition',
        recipeName: foodName
      };
      await sendFollowupMessage(interaction, env, result);
    } else {
      throw new Error('No nutrition result from Gemini API');
    }
  } catch (error) {
    console.error('Nutrition search error:', error);
    await sendFollowupMessage(interaction, env, {
      error: true,
      message: '栄養情報の検索中にエラーが発生しました。もう一度お試しください。'
    });
  }
}
