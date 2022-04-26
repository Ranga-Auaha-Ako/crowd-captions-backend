data "aws_secretsmanager_secret_version" "db" {
  secret_id = "${var.environment}/crowdcaptions/db"
}
data "aws_secretsmanager_secret_version" "panopto" {
  secret_id = "${var.environment}/crowdcaptions/panopto"
}
data "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = "${var.environment}/crowdcaptions/jwt_secret"
}

locals {
  db_creds = jsondecode(
    data.aws_secretsmanager_secret_version.db.secret_string
  )
  panopto_creds = jsondecode(
    data.aws_secretsmanager_secret_version.panopto.secret_string
  )
}
