# Variables for Discord Bots Terraform Configuration

# Cloudflare Configuration
variable "cloudflare_api_token" {
  description = "Cloudflare API Token with Workers:Edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for custom domains (optional)"
  type        = string
  default     = ""
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# Shared API Keys
variable "gemini_api_key" {
  description = "Google Gemini API Key (shared across most bots)"
  type        = string
  sensitive   = true
}

variable "openweather_api_key" {
  description = "OpenWeather API Key for weather bot"
  type        = string
  sensitive   = true
  default     = ""
}

# Cookbot Discord Configuration
variable "cookbot_discord_public_key" {
  description = "Discord Public Key for Cookbot"
  type        = string
  sensitive   = true
}

variable "cookbot_discord_bot_token" {
  description = "Discord Bot Token for Cookbot"
  type        = string
  sensitive   = true
}

variable "cookbot_discord_application_id" {
  description = "Discord Application ID for Cookbot"
  type        = string
}

# Mathbot Discord Configuration
variable "mathbot_discord_public_key" {
  description = "Discord Public Key for Mathbot"
  type        = string
  sensitive   = true
}

variable "mathbot_discord_bot_token" {
  description = "Discord Bot Token for Mathbot"
  type        = string
  sensitive   = true
}

variable "mathbot_discord_application_id" {
  description = "Discord Application ID for Mathbot"
  type        = string
}

# Musicbot Discord Configuration
variable "musicbot_discord_public_key" {
  description = "Discord Public Key for Musicbot"
  type        = string
  sensitive   = true
}

variable "musicbot_discord_bot_token" {
  description = "Discord Bot Token for Musicbot"
  type        = string
  sensitive   = true
}

variable "musicbot_discord_application_id" {
  description = "Discord Application ID for Musicbot"
  type        = string
}

# Newsbot Discord Configuration
variable "newsbot_discord_public_key" {
  description = "Discord Public Key for Newsbot"
  type        = string
  sensitive   = true
}

variable "newsbot_discord_bot_token" {
  description = "Discord Bot Token for Newsbot"
  type        = string
  sensitive   = true
}

variable "newsbot_discord_application_id" {
  description = "Discord Application ID for Newsbot"
  type        = string
}

# Petbot Discord Configuration
variable "petbot_discord_public_key" {
  description = "Discord Public Key for Petbot"
  type        = string
  sensitive   = true
}

variable "petbot_discord_bot_token" {
  description = "Discord Bot Token for Petbot"
  type        = string
  sensitive   = true
}

variable "petbot_discord_application_id" {
  description = "Discord Application ID for Petbot"
  type        = string
}

# Quizbot Discord Configuration
variable "quizbot_discord_public_key" {
  description = "Discord Public Key for Quizbot"
  type        = string
  sensitive   = true
}

variable "quizbot_discord_bot_token" {
  description = "Discord Bot Token for Quizbot"
  type        = string
  sensitive   = true
}

variable "quizbot_discord_application_id" {
  description = "Discord Application ID for Quizbot"
  type        = string
}

# Reminderbot Discord Configuration
variable "reminderbot_discord_public_key" {
  description = "Discord Public Key for Reminderbot"
  type        = string
  sensitive   = true
}

variable "reminderbot_discord_bot_token" {
  description = "Discord Bot Token for Reminderbot"
  type        = string
  sensitive   = true
}

variable "reminderbot_discord_application_id" {
  description = "Discord Application ID for Reminderbot"
  type        = string
}

# Translatebot Discord Configuration
variable "translatebot_discord_public_key" {
  description = "Discord Public Key for Translatebot"
  type        = string
  sensitive   = true
}

variable "translatebot_discord_bot_token" {
  description = "Discord Bot Token for Translatebot"
  type        = string
  sensitive   = true
}

variable "translatebot_discord_application_id" {
  description = "Discord Application ID for Translatebot"
  type        = string
}

# Weatherbot Discord Configuration
variable "weatherbot_discord_public_key" {
  description = "Discord Public Key for Weatherbot"
  type        = string
  sensitive   = true
}

variable "weatherbot_discord_bot_token" {
  description = "Discord Bot Token for Weatherbot"
  type        = string
  sensitive   = true
}

variable "weatherbot_discord_application_id" {
  description = "Discord Application ID for Weatherbot"
  type        = string
}