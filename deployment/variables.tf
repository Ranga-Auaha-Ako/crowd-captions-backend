variable "app_name" {
  description = "Name of the app"
  type        = string
  default     = "crowd-captions"
}

variable "environment" {
  description = "Environment (prod/staging)"
  type        = string
  default     = "staging"
}

variable "server_host" {
  description = "What domain name will this API end up on?"
  type        = string
}

variable "server_port" {
  description = "Server port"
  type        = number
  default     = 8000
}

variable "panopto_host" {
  description = "Panopto host"
  type        = string
  default     = "aucklandtest.au.panopto.com"
}

variable "panopto_client_id" {
  description = "Panopto Client ID"
  type        = string
  sensitive   = true
}

variable "panopto_client_secret" {
  description = "Panopto Client Secret"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "RDS root user password"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for login"
  type        = string
  sensitive   = true
}

variable "health_check_path" {
  description = "Path to check to see how service is doing"
  type        = string
  default     = "/"
}

variable "cert_arn" {
  description = "ARN for the certificate"
  type        = string
}

variable "app_version" {
  description = "Version of the tool to deploy"
  type        = string
  default     = "latest"
}
