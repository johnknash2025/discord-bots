# Discord Bots Monorepo

A unified monorepo for managing multiple Discord bots with a comprehensive CLI tool.

## 🚀 Quick Start

```bash
# List all available bots
./cli.js list

# Start development for a specific bot
./cli.js dev cookbot

# Deploy a bot to production
./cli.js deploy weatherbot

# Install dependencies for all bots
./cli.js install
```

## 📁 Monorepo Structure

```
discord-bots/
├── cli.js                    # Main CLI tool
├── package.json              # Monorepo configuration
├── README.md                 # This file
├── .gitignore               # Git ignore rules
├── discord-cookbot/         # Recipe and nutrition bot
├── discord-mathbot/         # Math calculations bot
├── discord-musicbot/        # Music information bot
├── discord-newsbot/         # News delivery bot
├── discord-petbot/          # Pet image analysis bot
├── discord-quizbot/         # Quiz games bot
├── discord-reminderbot/     # Reminders and scheduling bot
├── discord-translatebot/    # Multi-language translation bot
└── discord-weatherbot/      # Weather information bot
```

## 🛠️ CLI Commands

### Bot Management
- `list, ls` - List all available bots in monorepo
- `status [bot-name]` - Show status of bot(s)

### Development
- `dev, start <bot-name>` - Start development server
- `test <bot-name>` - Run tests for a bot
- `install [bot-name]` - Install dependencies (all bots if no name)
- `build` - Build all bots
- `clean` - Clean all bot dependencies

### Deployment
- `deploy <bot-name>` - Deploy to Cloudflare Workers
- `register <bot-name>` - Register Discord slash commands
- `logs, tail <bot-name>` - Show live logs

### Help
- `help` - Show detailed help information

## 🤖 Available Bots

All bots are Cloudflare Worker-based Discord bots:

1. **cookbot** - Recipe and nutrition information
2. **mathbot** - Math calculations and graphing
3. **musicbot** - Music information and lyrics search
4. **newsbot** - News delivery and updates
5. **petbot** - Pet image analysis and advice
6. **quizbot** - Interactive quiz games
7. **reminderbot** - Reminders and scheduling
8. **translatebot** - Multi-language translation
9. **weatherbot** - Weather information and forecasts

## 📦 Installation

```bash
# Install monorepo dependencies
npm install

# Install dependencies for all bots
./cli.js install
```

## 🔧 Development Workflow

1. **List available bots**
   ```bash
   ./cli.js list
   ```

2. **Check status of all bots**
   ```bash
   ./cli.js status
   ```

3. **Install dependencies for a specific bot**
   ```bash
   ./cli.js install cookbot
   ```

4. **Register Discord commands**
   ```bash
   ./cli.js register cookbot
   ```

5. **Start development**
   ```bash
   ./cli.js dev cookbot
   ```

6. **Deploy to production**
   ```bash
   ./cli.js deploy cookbot
   ```

## 🌟 Monorepo Benefits

- **Unified Management**: Single CLI to manage all bots
- **Shared Dependencies**: Common utilities and configurations
- **Consistent Development**: Same patterns across all bots
- **Easy Deployment**: One-command deployment per bot
- **Atomic Changes**: Cross-bot updates in single commits
- **Simplified CI/CD**: Single pipeline for the entire collection

## 📋 Requirements

- Node.js 18+
- Cloudflare Workers account
- Discord Developer account
- Wrangler CLI (installed automatically with bot dependencies)

## 🔐 Environment Setup

Each bot requires environment variables. Copy `.dev.vars.example` to `.dev.vars` in each bot directory and configure:

```env
DISCORD_PUBLIC_KEY=your_discord_public_key
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_APPLICATION_ID=your_application_id
# Additional API keys as needed per bot
```

## 🚀 Production Deployment

1. **Set up Cloudflare Workers secrets**
   ```bash
   cd discord-cookbot
   ./scripts/deploy-secrets.sh
   ```

2. **Deploy the bot**
   ```bash
   ../cli.js deploy cookbot
   ```

3. **Monitor logs**
   ```bash
   ../cli.js logs cookbot
   ```

## 🔄 Git Workflow

This monorepo uses feature branches for development:

```bash
# Create feature branch
git checkout -b feature/new-bot-feature

# Make changes and commit
git add .
git commit -m "Add new feature to cookbot"

# Push and create PR
git push origin feature/new-bot-feature
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using the CLI
5. Submit a pull request

## 📄 License

MIT License - see individual bot directories for specific licenses.

## 🆘 Support

For issues or questions:
1. Check the individual bot README files
2. Use `./cli.js help` for CLI usage
3. Create an issue in the repository