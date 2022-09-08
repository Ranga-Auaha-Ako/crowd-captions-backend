resource "aws_iam_role" "ecs_role" {
  name = "ecs_role_${var.app_name}_${terraform.workspace == "default" ? "staging" : terraform.workspace}"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY
}

resource "aws_iam_policy" "fargateTask" {
  name        = "ecs_policy_${var.app_name}_${terraform.workspace == "default" ? "staging" : terraform.workspace}"
  description = "${var.app_name} ${terraform.workspace == "default" ? "staging" : terraform.workspace} policy"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid = "Stmt1651042406307",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents"
        ],
        Effect = "Allow",
        Resource = [
          "${aws_cloudwatch_log_group.audit.arn}",
          "${aws_cloudwatch_log_group.audit.arn}:log-stream:*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ],
        Resource = "*"
      },

    ]
  })
}


resource "aws_iam_role_policy_attachment" "ecs_policy_attachment_exec" {
  role       = aws_iam_role.ecs_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  depends_on = [
    aws_iam_role.ecs_role
  ]
}
resource "aws_iam_role_policy_attachment" "ecs_policy_attachment_logs" {
  role       = aws_iam_role.ecs_role.name
  policy_arn = aws_iam_policy.fargateTask.arn
  depends_on = [
    aws_iam_role.ecs_role
  ]
}


# IAM Roles and Policies for Backups: https://github.com/vinycoolguy2015/awslambda/blob/master/terraform_aws_backup/backup_module/iam.tf
data "aws_iam_policy_document" "aws-backup-service-assume-role-policy" {
  statement {
    sid     = "AssumeServiceRole"
    actions = ["sts:AssumeRole"]
    effect  = "Allow"
    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }
  }
}

/* The policies that allow the backup service to take backups and restores */
data "aws_iam_policy" "aws-backup-service-policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

data "aws_iam_policy" "aws-restore-service-policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
}

data "aws_caller_identity" "current_account" {}

/* Roles for taking AWS Backups */
resource "aws_iam_role" "aws-backup-service-role" {
  name               = "AWSBackupServiceRole-${var.app_name}-${terraform.workspace == "default" ? "staging" : terraform.workspace}"
  description        = "Allows the AWS Backup Service to take scheduled backups"
  assume_role_policy = data.aws_iam_policy_document.aws-backup-service-assume-role-policy.json
}

resource "aws_iam_role_policy" "backup-service-aws-backup-role-policy" {
  policy = data.aws_iam_policy.aws-backup-service-policy.policy
  role   = aws_iam_role.aws-backup-service-role.name
}

resource "aws_iam_role_policy" "restore-service-aws-backup-role-policy" {
  policy = data.aws_iam_policy.aws-restore-service-policy.policy
  role   = aws_iam_role.aws-backup-service-role.name
}
