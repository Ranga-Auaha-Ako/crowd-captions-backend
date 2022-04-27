data "aws_secretsmanager_secret_version" "db" {
  secret_id = "${terraform.workspace == "default" ? "staging" : terraform.workspace}/crowdcaptions/db"
}
data "aws_secretsmanager_secret_version" "panopto" {
  secret_id = "${terraform.workspace == "default" ? "staging" : terraform.workspace}/crowdcaptions/panopto"
}
data "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = "${terraform.workspace == "default" ? "staging" : terraform.workspace}/crowdcaptions/jwt_secret"
}

locals {
  db_creds = jsondecode(
    data.aws_secretsmanager_secret_version.db.secret_string
  )
  panopto_creds = jsondecode(
    data.aws_secretsmanager_secret_version.panopto.secret_string
  )
}
