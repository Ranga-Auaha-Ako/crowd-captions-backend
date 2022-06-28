resource "aws_backup_plan" "backups" {
  name = "${var.app_name}_${terraform.workspace == "default" ? "staging" : terraform.workspace}_backups"

  rule {
    rule_name         = "daily"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 12 * * ? *)"

    lifecycle {
      delete_after = 14
    }
  }

  rule {
    rule_name         = "weekly"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 12 1 * ? *)"

    lifecycle {
      delete_after = 365
    }
  }
}

resource "aws_backup_vault" "main" {
  name = "${var.app_name}_${terraform.workspace == "default" ? "staging" : terraform.workspace}_backups"
}

# https://github.com/vinycoolguy2015/awslambda/blob/master/terraform_aws_backup/backup_module/backup.tf
resource "aws_backup_selection" "backup-selection" {
  iam_role_arn = aws_iam_role.aws-backup-service-role.arn
  name         = "backup_resources"
  plan_id      = aws_backup_plan.backups.id
  selection_tag {
    type  = "STRINGEQUALS"
    key   = "BackupPlan"
    value = aws_backup_plan.backups.name
  }
}
