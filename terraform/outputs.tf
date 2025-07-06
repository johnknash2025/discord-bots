# Terraform Outputs for Discord Bots

output "deployment_summary" {
  description = "Summary of all deployed Discord bots"
  value = {
    environment = var.environment
    total_bots  = length(local.bots)
    deployed_at = timestamp()
  }
}

output "worker_endpoints" {
  description = "Cloudflare Worker endpoints for each bot"
  value = {
    for k, v in cloudflare_worker_script.discord_bots : k => {
      name        = v.name
      url         = "https://${v.name}.${var.cloudflare_account_id}.workers.dev"
      description = local.bots[k].description
      environment = var.environment
    }
  }
}

output "custom_domain_routes" {
  description = "Custom domain routes (if configured)"
  value = var.cloudflare_zone_id != "" ? {
    for k, v in cloudflare_worker_route.discord_bot_routes : k => {
      pattern = v.pattern
      worker  = v.script_name
    }
  } : {}
}

output "bot_configurations" {
  description = "Configuration summary for each bot"
  value = {
    for k, v in local.bots : k => {
      name        = v.name
      description = v.description
      script_path = v.script_path
      env_vars    = keys(v.env_vars)
    }
  }
  sensitive = false
}

output "terraform_workspace" {
  description = "Current Terraform workspace"
  value = terraform.workspace
}

output "deployment_instructions" {
  description = "Next steps after deployment"
  value = <<-EOT
    🎉 Discord Bots deployed successfully!
    
    📋 Next Steps:
    1. Register Discord slash commands for each bot
    2. Configure Discord bot permissions in your servers
    3. Test each bot endpoint
    4. Monitor logs using: wrangler tail <worker-name>
    
    🔗 Worker URLs:
    ${join("\n    ", [for k, v in cloudflare_worker_script.discord_bots : "• ${k}: https://${v.name}.${var.cloudflare_account_id}.workers.dev"])}
    
    📚 Management:
    • Use CLI: ./cli.js status
    • Terraform: terraform show
    • Cloudflare Dashboard: https://dash.cloudflare.com/
  EOT
}