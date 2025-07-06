# 🏗️ Discord Bots Terraform Configuration

TerraformでDiscord BotsをCloudflare Workersにデプロイ・管理するための設定です。

## 📋 前提条件

- Terraform >= 1.0
- Cloudflare アカウント
- Cloudflare API Token (Workers:Edit権限)
- 各ボット用のDiscord Application設定

## 🚀 セットアップ

### 1. Terraform設定ファイルの準備

```bash
# terraform.tfvarsファイルを作成
cp terraform.tfvars.example terraform.tfvars

# 実際の値を設定
vim terraform.tfvars
```

### 2. 必要な値の取得

#### Cloudflare設定
```bash
# Account IDの取得
# Cloudflare Dashboard → 右サイドバーに表示

# API Tokenの作成
# Cloudflare Dashboard → My Profile → API Tokens → Create Token
# Template: "Custom token"
# Permissions: Account:Cloudflare Workers:Edit, Zone:Zone:Read
```

#### Discord設定（各ボット毎）
```bash
# Discord Developer Portal (https://discord.com/developers/applications)
# 1. Application作成
# 2. Bot作成
# 3. 以下の値を取得:
#    - Application ID
#    - Public Key
#    - Bot Token
```

### 3. Terraformの初期化と実行

```bash
cd terraform

# 初期化
terraform init

# プランの確認
terraform plan

# デプロイ実行
terraform apply
```

## 📁 ファイル構成

```
terraform/
├── main.tf                    # メイン設定
├── variables.tf               # 変数定義
├── outputs.tf                 # 出力設定
├── terraform.tfvars.example   # 設定例
├── .gitignore                # Git除外設定
└── README.md                 # このファイル
```

## 🤖 管理対象ボット

以下の9つのDiscord Botが管理されます：

1. **cookbot** - 料理レシピ・栄養情報
2. **mathbot** - 数学計算・グラフ描画
3. **musicbot** - 音楽情報・歌詞検索
4. **newsbot** - ニュース配信
5. **petbot** - ペット画像解析
6. **quizbot** - クイズゲーム
7. **reminderbot** - リマインダー・スケジュール
8. **translatebot** - 多言語翻訳
9. **weatherbot** - 天気予報

## 🔧 Terraform コマンド

### 基本操作
```bash
# 初期化
terraform init

# プラン表示
terraform plan

# 適用
terraform apply

# 状態確認
terraform show

# 出力確認
terraform output

# 破棄
terraform destroy
```

### 特定ボットのみ操作
```bash
# 特定ボットのみデプロイ
terraform apply -target=cloudflare_worker_script.discord_bots["cookbot"]

# 特定ボットのみ削除
terraform destroy -target=cloudflare_worker_script.discord_bots["cookbot"]
```

### 環境別管理
```bash
# 開発環境
terraform workspace new dev
terraform apply -var="environment=dev"

# 本番環境
terraform workspace new prod
terraform apply -var="environment=prod"
```

## 🌍 環境変数管理

### 環境別設定
```bash
# 開発環境用
terraform.tfvars.dev

# 本番環境用
terraform.tfvars.prod
```

### 機密情報の管理
```bash
# 環境変数で設定
export TF_VAR_cloudflare_api_token="your_token"
export TF_VAR_gemini_api_key="your_key"

# または、terraform.tfvarsファイルで管理（.gitignoreに追加済み）
```

## 📊 デプロイ後の確認

### Worker URL確認
```bash
terraform output worker_endpoints
```

### ログ監視
```bash
# 特定ボットのログ
wrangler tail discord-cookbot-prod

# 全ボットのログ（別ターミナルで）
for bot in cookbot mathbot musicbot newsbot petbot quizbot reminderbot translatebot weatherbot; do
  echo "=== $bot ==="
  wrangler tail discord-$bot-prod &
done
```

## 🔄 CI/CD統合

### GitHub Actions例
```yaml
name: Deploy Discord Bots
on:
  push:
    branches: [main]
    paths: ['terraform/**', 'discord-*/**']

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2
      
      - name: Terraform Init
        run: terraform init
        working-directory: terraform
        
      - name: Terraform Plan
        run: terraform plan
        working-directory: terraform
        env:
          TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          
      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: terraform
        env:
          TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## 🛠️ トラブルシューティング

### よくある問題

1. **API Token権限エラー**
   ```bash
   # 必要な権限を確認
   # Account:Cloudflare Workers:Edit
   # Zone:Zone:Read (カスタムドメイン使用時)
   ```

2. **Worker名の重複**
   ```bash
   # 環境変数で区別
   terraform apply -var="environment=dev"
   ```

3. **スクリプトファイルが見つからない**
   ```bash
   # パスを確認
   ls -la ../discord-*/
   ```

## 📈 スケーリング

### 新しいボットの追加
1. `main.tf`の`locals.bots`に追加
2. `variables.tf`に変数追加
3. `terraform.tfvars`に値設定
4. `terraform apply`実行

### リソース制限
- Cloudflare Workers無料プラン: 100,000リクエスト/日
- 有料プラン: 10M+リクエスト/月

## 🔐 セキュリティ

- `terraform.tfvars`は`.gitignore`に追加済み
- 機密情報は環境変数で管理推奨
- API Tokenは最小権限で作成
- 定期的なToken更新を実施

## 📞 サポート

問題や質問がある場合：
1. Terraformログを確認
2. Cloudflare Dashboardで状態確認
3. GitHubのIssuesで報告