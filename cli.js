#!/usr/bin/env node

/*
 * Discord Bots CLI Tool
 * Unified command-line interface for managing Discord bots in the monorepo
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Bot discovery and management for monorepo
class BotManager {
  constructor() {
    this.monorepoRoot = __dirname;
  }

  async discoverBots() {
    const bots = [];
    
    // Scan current directory for discord-* bot directories
    const entries = await readdir(this.monorepoRoot);
    
    for (const entry of entries) {
      if (entry.startsWith('discord-')) {
        const botPath = path.join(this.monorepoRoot, entry);
        const botStat = await stat(botPath);
        
        if (botStat.isDirectory()) {
          const botName = entry.replace('discord-', '');
          const mainFile = path.join(botPath, `${botName}.js`);
          
          try {
            await stat(mainFile);
            bots.push({
              name: botName,
              type: 'cloudflare-worker',
              path: mainFile,
              directory: botPath
            });
          } catch (e) {
            // Main file doesn't exist, skip
          }
        }
      }
    }

    return bots;
  }

  async getBotInfo(botName) {
    const bots = await this.discoverBots();
    return bots.find(bot => bot.name === botName);
  }

  async listBots() {
    const bots = await this.discoverBots();
    
    console.log(`${colors.cyan}${colors.bright}🤖 Discord Bots Monorepo:${colors.reset}\n`);
    
    if (bots.length === 0) {
      console.log(`${colors.yellow}No bots found in monorepo.${colors.reset}`);
      return;
    }

    bots.forEach((bot, index) => {
      console.log(`${colors.bright}${index + 1}. ☁️ ${bot.name}${colors.reset}`);
      console.log(`   Type: ${colors.blue}Cloudflare Worker${colors.reset}`);
      console.log(`   Path: ${colors.magenta}${bot.path}${colors.reset}`);
      console.log('');
    });
  }
}

// Command handlers
class CommandHandler {
  constructor() {
    this.botManager = new BotManager();
  }

  async runCommand(command, args) {
    switch (command) {
      case 'list':
      case 'ls':
        await this.botManager.listBots();
        break;
      
      case 'dev':
      case 'start':
        await this.startDev(args[0]);
        break;
      
      case 'deploy':
        await this.deploy(args[0]);
        break;
      
      case 'test':
        await this.test(args[0]);
        break;
      
      case 'register':
      case 'register-commands':
        await this.registerCommands(args[0]);
        break;
      
      case 'install':
        await this.install(args[0]);
        break;
      
      case 'logs':
      case 'tail':
        await this.showLogs(args[0]);
        break;
      
      case 'status':
        await this.showStatus(args[0]);
        break;

      case 'build':
        await this.buildAll();
        break;

      case 'clean':
        await this.cleanAll();
        break;

      case 'terraform':
      case 'tf':
        await this.terraform(args[0], args.slice(1));
        break;

      case 'deploy-all':
        await this.deployAll();
        break;

      case 'setup-terraform':
        await this.setupTerraform();
        break;
      
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }

  async startDev(botName) {
    if (!botName) {
      console.log(`${colors.red}❌ Bot name required. Use: ./cli.js dev <bot-name>${colors.reset}`);
      return;
    }

    const bot = await this.botManager.getBotInfo(botName);
    if (!bot) {
      console.log(`${colors.red}❌ Bot '${botName}' not found.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}🚀 Starting development server for ${bot.name}...${colors.reset}`);
    this.runInDirectory(bot.directory, 'npm', ['run', 'start']);
  }

  async deploy(botName) {
    if (!botName) {
      console.log(`${colors.red}❌ Bot name required. Use: ./cli.js deploy <bot-name>${colors.reset}`);
      return;
    }

    const bot = await this.botManager.getBotInfo(botName);
    if (!bot) {
      console.log(`${colors.red}❌ Bot '${botName}' not found.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}🚀 Deploying ${bot.name} to Cloudflare Workers...${colors.reset}`);
    this.runInDirectory(bot.directory, 'npm', ['run', 'deploy']);
  }

  async test(botName) {
    if (!botName) {
      console.log(`${colors.red}❌ Bot name required. Use: ./cli.js test <bot-name>${colors.reset}`);
      return;
    }

    const bot = await this.botManager.getBotInfo(botName);
    if (!bot) {
      console.log(`${colors.red}❌ Bot '${botName}' not found.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}🧪 Running tests for ${bot.name}...${colors.reset}`);
    this.runInDirectory(bot.directory, 'npm', ['test']);
  }

  async registerCommands(botName) {
    if (!botName) {
      console.log(`${colors.red}❌ Bot name required. Use: ./cli.js register <bot-name>${colors.reset}`);
      return;
    }

    const bot = await this.botManager.getBotInfo(botName);
    if (!bot) {
      console.log(`${colors.red}❌ Bot '${botName}' not found.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}📝 Registering Discord commands for ${bot.name}...${colors.reset}`);
    this.runInDirectory(bot.directory, 'npm', ['run', 'register-commands']);
  }

  async install(botName) {
    if (!botName) {
      // Install for all bots
      const bots = await this.botManager.discoverBots();
      console.log(`${colors.green}📦 Installing dependencies for all bots...${colors.reset}`);
      
      for (const bot of bots) {
        console.log(`${colors.blue}Installing for ${bot.name}...${colors.reset}`);
        await this.runInDirectoryAsync(bot.directory, 'npm', ['install']);
      }
      return;
    }

    const bot = await this.botManager.getBotInfo(botName);
    if (!bot) {
      console.log(`${colors.red}❌ Bot '${botName}' not found.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}📦 Installing dependencies for ${bot.name}...${colors.reset}`);
    this.runInDirectory(bot.directory, 'npm', ['install']);
  }

  async buildAll() {
    const bots = await this.botManager.discoverBots();
    console.log(`${colors.green}🔨 Building all bots...${colors.reset}`);
    
    for (const bot of bots) {
      console.log(`${colors.blue}Building ${bot.name}...${colors.reset}`);
      try {
        await this.runInDirectoryAsync(bot.directory, 'npm', ['run', 'build']);
      } catch (error) {
        console.log(`${colors.yellow}⚠️  No build script for ${bot.name}${colors.reset}`);
      }
    }
  }

  async cleanAll() {
    const bots = await this.botManager.discoverBots();
    console.log(`${colors.green}🧹 Cleaning all bots...${colors.reset}`);
    
    for (const bot of bots) {
      console.log(`${colors.blue}Cleaning ${bot.name}...${colors.reset}`);
      try {
        await this.runInDirectoryAsync(bot.directory, 'rm', ['-rf', 'node_modules']);
        await this.runInDirectoryAsync(bot.directory, 'rm', ['-rf', '.wrangler']);
      } catch (error) {
        // Ignore errors
      }
    }
  }

  async terraform(command, args) {
    const terraformDir = path.join(this.botManager.monorepoRoot, 'terraform');
    
    try {
      await stat(terraformDir);
    } catch (e) {
      console.log(`${colors.red}❌ Terraform directory not found. Run './cli.js setup-terraform' first.${colors.reset}`);
      return;
    }

    if (!command) {
      console.log(`${colors.red}❌ Terraform command required. Use: ./cli.js terraform <command>${colors.reset}`);
      console.log(`${colors.blue}Available commands: init, plan, apply, destroy, output, show${colors.reset}`);
      return;
    }

    console.log(`${colors.green}🏗️  Running terraform ${command}...${colors.reset}`);
    
    switch (command) {
      case 'init':
        this.runInDirectory(terraformDir, 'terraform', ['init']);
        break;
      case 'plan':
        this.runInDirectory(terraformDir, 'terraform', ['plan']);
        break;
      case 'apply':
        this.runInDirectory(terraformDir, 'terraform', ['apply', ...args]);
        break;
      case 'destroy':
        this.runInDirectory(terraformDir, 'terraform', ['destroy', ...args]);
        break;
      case 'output':
        this.runInDirectory(terraformDir, 'terraform', ['output', ...args]);
        break;
      case 'show':
        this.runInDirectory(terraformDir, 'terraform', ['show']);
        break;
      case 'workspace':
        this.runInDirectory(terraformDir, 'terraform', ['workspace', ...args]);
        break;
      default:
        this.runInDirectory(terraformDir, 'terraform', [command, ...args]);
        break;
    }
  }

  async deployAll() {
    console.log(`${colors.green}🚀 Deploying all bots using Terraform...${colors.reset}`);
    
    const terraformDir = path.join(this.botManager.monorepoRoot, 'terraform');
    
    try {
      await stat(terraformDir);
    } catch (e) {
      console.log(`${colors.red}❌ Terraform not set up. Run './cli.js setup-terraform' first.${colors.reset}`);
      return;
    }

    console.log(`${colors.blue}1. Initializing Terraform...${colors.reset}`);
    await this.runInDirectoryAsync(terraformDir, 'terraform', ['init']);
    
    console.log(`${colors.blue}2. Planning deployment...${colors.reset}`);
    await this.runInDirectoryAsync(terraformDir, 'terraform', ['plan']);
    
    console.log(`${colors.blue}3. Applying changes...${colors.reset}`);
    this.runInDirectory(terraformDir, 'terraform', ['apply']);
  }

  async setupTerraform() {
    console.log(`${colors.green}🏗️  Setting up Terraform configuration...${colors.reset}`);
    
    const terraformDir = path.join(this.botManager.monorepoRoot, 'terraform');
    
    try {
      await stat(terraformDir);
      console.log(`${colors.yellow}⚠️  Terraform directory already exists.${colors.reset}`);
    } catch (e) {
      console.log(`${colors.red}❌ Terraform directory not found. Please ensure terraform/ directory exists.${colors.reset}`);
      return;
    }

    // Check if terraform.tfvars exists
    const tfvarsPath = path.join(terraformDir, 'terraform.tfvars');
    try {
      await stat(tfvarsPath);
      console.log(`${colors.green}✅ terraform.tfvars already exists.${colors.reset}`);
    } catch (e) {
      console.log(`${colors.yellow}⚠️  terraform.tfvars not found.${colors.reset}`);
      console.log(`${colors.blue}Please copy terraform.tfvars.example to terraform.tfvars and configure:${colors.reset}`);
      console.log(`   cd terraform`);
      console.log(`   cp terraform.tfvars.example terraform.tfvars`);
      console.log(`   # Edit terraform.tfvars with your actual values`);
    }

    // Check if Terraform is installed
    try {
      await this.runInDirectoryAsync(terraformDir, 'terraform', ['version']);
      console.log(`${colors.green}✅ Terraform is installed.${colors.reset}`);
    } catch (e) {
      console.log(`${colors.red}❌ Terraform not installed. Please install Terraform first.${colors.reset}`);
      console.log(`${colors.blue}Installation: https://terraform.io/downloads${colors.reset}`);
      return;
    }

    console.log(`${colors.green}🎯 Next steps:${colors.reset}`);
    console.log(`   1. Configure terraform.tfvars with your API keys`);
    console.log(`   2. Run: ./cli.js terraform init`);
    console.log(`   3. Run: ./cli.js terraform plan`);
    console.log(`   4. Run: ./cli.js terraform apply`);
    console.log(`   5. Or use: ./cli.js deploy-all`);
  }

  async showLogs(botName) {
    if (!botName) {
      console.log(`${colors.red}❌ Bot name required. Use: ./cli.js logs <bot-name>${colors.reset}`);
      return;
    }

    const bot = await this.botManager.getBotInfo(botName);
    if (!bot) {
      console.log(`${colors.red}❌ Bot '${botName}' not found.${colors.reset}`);
      return;
    }

    console.log(`${colors.green}📋 Showing logs for ${bot.name}...${colors.reset}`);
    this.runInDirectory(bot.directory, 'wrangler', ['tail']);
  }

  async showStatus(botName) {
    if (!botName) {
      const bots = await this.botManager.discoverBots();
      console.log(`${colors.cyan}${colors.bright}📊 Monorepo Status Overview:${colors.reset}\n`);
      
      for (const bot of bots) {
        await this.showBotStatus(bot);
      }
      return;
    }

    const bot = await this.botManager.getBotInfo(botName);
    if (!bot) {
      console.log(`${colors.red}❌ Bot '${botName}' not found.${colors.reset}`);
      return;
    }

    await this.showBotStatus(bot);
  }

  async showBotStatus(bot) {
    console.log(`${colors.bright}🤖 ${bot.name}${colors.reset}`);
    console.log(`   Type: ${colors.blue}${bot.type}${colors.reset}`);
    console.log(`   Path: ${colors.magenta}${bot.path}${colors.reset}`);
    
    // Check if package.json exists and has dependencies installed
    try {
      const packagePath = path.join(bot.directory, 'package.json');
      const nodeModulesPath = path.join(bot.directory, 'node_modules');
      
      await stat(packagePath);
      
      try {
        await stat(nodeModulesPath);
        console.log(`   Dependencies: ${colors.green}✅ Installed${colors.reset}`);
      } catch (e) {
        console.log(`   Dependencies: ${colors.red}❌ Not installed${colors.reset}`);
      }
    } catch (e) {
      console.log(`   Package: ${colors.red}❌ No package.json${colors.reset}`);
    }
    
    console.log('');
  }

  runInDirectory(directory, command, args) {
    const child = spawn(command, args, {
      cwd: directory,
      stdio: 'inherit'
    });

    child.on('error', (error) => {
      console.error(`${colors.red}❌ Failed to start ${command}: ${error.message}${colors.reset}`);
    });
  }

  async runInDirectoryAsync(directory, command, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: directory,
        stdio: 'pipe'
      });

      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        output += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed with code ${code}: ${output}`));
        }
      });

      child.on('error', reject);
    });
  }

  showHelp() {
    console.log(`${colors.cyan}${colors.bright}🤖 Discord Bots Monorepo CLI${colors.reset}\n`);
    console.log(`${colors.bright}Usage:${colors.reset} ./cli.js <command> [options]\n`);
    
    console.log(`${colors.bright}Commands:${colors.reset}`);
    console.log(`  ${colors.green}list, ls${colors.reset}                    List all bots in monorepo`);
    console.log(`  ${colors.green}dev, start${colors.reset} <bot-name>       Start development server for a bot`);
    console.log(`  ${colors.green}deploy${colors.reset} <bot-name>           Deploy bot to Cloudflare Workers`);
    console.log(`  ${colors.green}test${colors.reset} <bot-name>             Run tests for a bot`);
    console.log(`  ${colors.green}register${colors.reset} <bot-name>         Register Discord slash commands`);
    console.log(`  ${colors.green}install${colors.reset} [bot-name]          Install dependencies (all bots if no name)`);
    console.log(`  ${colors.green}build${colors.reset}                       Build all bots`);
    console.log(`  ${colors.green}clean${colors.reset}                       Clean all bot dependencies`);
    console.log(`  ${colors.green}logs, tail${colors.reset} <bot-name>       Show live logs for a deployed bot`);
    console.log(`  ${colors.green}status${colors.reset} [bot-name]           Show status of bot(s)`);
    console.log(`  ${colors.green}help${colors.reset}                        Show this help message\n`);
    
    console.log(`${colors.bright}Terraform Commands:${colors.reset}`);
    console.log(`  ${colors.cyan}setup-terraform${colors.reset}             Set up Terraform configuration`);
    console.log(`  ${colors.cyan}terraform, tf${colors.reset} <command>     Run Terraform commands`);
    console.log(`  ${colors.cyan}deploy-all${colors.reset}                  Deploy all bots using Terraform\n`);
    
    console.log(`${colors.bright}Examples:${colors.reset}`);
    console.log(`  ./cli.js list`);
    console.log(`  ./cli.js dev cookbot`);
    console.log(`  ./cli.js deploy weatherbot`);
    console.log(`  ./cli.js install`);
    console.log(`  ./cli.js status`);
    console.log(`  ./cli.js setup-terraform`);
    console.log(`  ./cli.js terraform init`);
    console.log(`  ./cli.js terraform plan`);
    console.log(`  ./cli.js deploy-all`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const commandArgs = args.slice(1);

  const handler = new CommandHandler();
  await handler.runCommand(command, commandArgs);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}