# 🌍 Environment-Specific Configurations

このディレクトリには環境別のTerraform設定ファイルが含まれています。

## 📁 ファイル構成

```
environments/
├── dev.tfvars.example      # 開発環境設定例
├── prod.tfvars.example     # 本番環境設定例
├── dev.tfvars             # 開発環境設定（作成が必要）
├── prod.tfvars            # 本番環境設定（作成が必要）
└── README.md              # このファイル
```

## 🚀 セットアップ

### 1. 環境設定ファイルの作成

```bash
# 開発環境
cp dev.tfvars.example dev.tfvars
# dev.tfvarsを編集して実際の値を設定

# 本番環境
cp prod.tfvars.example prod.tfvars
# prod.tfvarsを編集して実際の値を設定
```

### 2. 環境別デプロイ

```bash
# 開発環境にデプロイ
cd ../
terraform workspace new dev
terraform apply -var-file="environments/dev.tfvars"

# 本番環境にデプロイ
terraform workspace new prod
terraform apply -var-file="environments/prod.tfvars"
```

## 🔧 CLI統合

```bash
# CLIから環境別デプロイ
./cli.js terraform workspace new dev
./cli.js terraform apply -var-file="environments/dev.tfvars"

./cli.js terraform workspace new prod
./cli.js terraform apply -var-file="environments/prod.tfvars"
```

## 🔐 セキュリティ

- `*.tfvars`ファイルは`.gitignore`に追加済み
- 機密情報は環境変数での管理も推奨
- 本番環境とは別のDiscord Applicationを開発環境で使用

## 📋 環境別設定項目

### 共通設定
- Cloudflare API Token
- Cloudflare Account ID
- Gemini API Key
- OpenWeather API Key

### 環境別設定
- Discord Application ID（各ボット）
- Discord Bot Token（各ボット）
- Discord Public Key（各ボット）
- Cloudflare Zone ID（本番環境のみ）

## 🌟 ベストプラクティス

1. **開発環境**: 別のDiscord Serverでテスト
2. **本番環境**: カスタムドメインとモニタリング設定
3. **設定管理**: 環境変数とTerraform Cloudの活用
4. **デプロイ**: CI/CDパイプラインでの自動化