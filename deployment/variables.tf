variable "app_name" {
  description = "Name of the app"
  type        = string
  default     = "crowd-captions"
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

variable "health_check_path" {
  description = "Path to check to see how service is doing"
  type        = string
  default     = "/health"
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
