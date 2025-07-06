# Discord Bots Terraform Configuration
# Manages Cloudflare Workers deployment for all Discord bots

terraform {
  required_version = ">= 1.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Configure Cloudflare Provider
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Variables
variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID (optional, for custom domains)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# Discord Bot configurations
locals {
  bots = {
    cookbot = {
      name        = "discord-cookbot"
      script_path = "../discord-cookbot/cookbot.js"
      description = "Recipe and nutrition Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.cookbot_discord_public_key
        DISCORD_BOT_TOKEN      = var.cookbot_discord_bot_token
        DISCORD_APPLICATION_ID = var.cookbot_discord_application_id
        GEMINI_API_KEY        = var.gemini_api_key
      }
    }
    
    mathbot = {
      name        = "discord-mathbot"
      script_path = "../discord-mathbot/mathbot.js"
      description = "Math calculations Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.mathbot_discord_public_key
        DISCORD_BOT_TOKEN      = var.mathbot_discord_bot_token
        DISCORD_APPLICATION_ID = var.mathbot_discord_application_id
        GEMINI_API_KEY        = var.gemini_api_key
      }
    }
    
    musicbot = {
      name        = "discord-musicbot"
      script_path = "../discord-musicbot/musicbot.js"
      description = "Music information Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.musicbot_discord_public_key
        DISCORD_BOT_TOKEN      = var.musicbot_discord_bot_token
        DISCORD_APPLICATION_ID = var.musicbot_discord_application_id
        GEMINI_API_KEY        = var.gemini_api_key
      }
    }
    
    newsbot = {
      name        = "discord-newsbot"
      script_path = "../discord-newsbot/newsbot.js"
      description = "News delivery Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.newsbot_discord_public_key
        DISCORD_BOT_TOKEN      = var.newsbot_discord_bot_token
        DISCORD_APPLICATION_ID = var.newsbot_discord_application_id
        GEMINI_API_KEY        = var.gemini_api_key
      }
    }
    
    petbot = {
      name        = "discord-petbot"
      script_path = "../discord-petbot/petbot.js"
      description = "Pet image analysis Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.petbot_discord_public_key
        DISCORD_BOT_TOKEN      = var.petbot_discord_bot_token
        DISCORD_APPLICATION_ID = var.petbot_discord_application_id
        GEMINI_API_KEY        = var.gemini_api_key
      }
    }
    
    quizbot = {
      name        = "discord-quizbot"
      script_path = "../discord-quizbot/quizbot.js"
      description = "Quiz games Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.quizbot_discord_public_key
        DISCORD_BOT_TOKEN      = var.quizbot_discord_bot_token
        DISCORD_APPLICATION_ID = var.quizbot_discord_application_id
        GEMINI_API_KEY        = var.gemini_api_key
      }
    }
    
    reminderbot = {
      name        = "discord-reminderbot"
      script_path = "../discord-reminderbot/reminderbot.js"
      description = "Reminders and scheduling Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.reminderbot_discord_public_key
        DISCORD_BOT_TOKEN      = var.reminderbot_discord_bot_token
        DISCORD_APPLICATION_ID = var.reminderbot_discord_application_id
        GEMINI_API_KEY        = var.gemini_api_key
      }
    }
    
    translatebot = {
      name        = "discord-translatebot"
      script_path = "../discord-translatebot/translatebot.js"
      description = "Multi-language translation Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.translatebot_discord_public_key
        DISCORD_BOT_TOKEN      = var.translatebot_discord_bot_token
        DISCORD_APPLICATION_ID = var.translatebot_discord_application_id
        GEMINI_API_KEY        = var.gemini_api_key
      }
    }
    
    weatherbot = {
      name        = "discord-weatherbot"
      script_path = "../discord-weatherbot/weatherbot.js"
      description = "Weather information Discord bot"
      env_vars = {
        DISCORD_PUBLIC_KEY     = var.weatherbot_discord_public_key
        DISCORD_BOT_TOKEN      = var.weatherbot_discord_bot_token
        DISCORD_APPLICATION_ID = var.weatherbot_discord_application_id
        OPENWEATHER_API_KEY   = var.openweather_api_key
      }
    }
  }
}

# Create Cloudflare Workers for each bot
resource "cloudflare_worker_script" "discord_bots" {
  for_each = local.bots
  
  account_id = var.cloudflare_account_id
  name       = "${each.value.name}-${var.environment}"
  content    = file(each.value.script_path)
  
  # Environment variables (secrets)
  dynamic "secret_text_binding" {
    for_each = each.value.env_vars
    content {
      name = secret_text_binding.key
      text = secret_text_binding.value
    }
  }
  
  # Module bindings for utilities
  module = "discord.js"
  
  tags = [
    "discord-bot",
    "environment:${var.environment}",
    "bot:${each.key}"
  ]
}

# Create custom domains for each bot (optional)
resource "cloudflare_worker_route" "discord_bot_routes" {
  for_each = var.cloudflare_zone_id != "" ? local.bots : {}
  
  zone_id = var.cloudflare_zone_id
  pattern = "${each.key}.yourdomain.com/*"
  script_name = cloudflare_worker_script.discord_bots[each.key].name
}

# Outputs
output "worker_urls" {
  description = "URLs for deployed Discord bots"
  value = {
    for k, v in cloudflare_worker_script.discord_bots : k => "https://${v.name}.${var.cloudflare_account_id}.workers.dev"
  }
}

output "worker_names" {
  description = "Names of deployed workers"
  value = {
    for k, v in cloudflare_worker_script.discord_bots : k => v.name
  }
}