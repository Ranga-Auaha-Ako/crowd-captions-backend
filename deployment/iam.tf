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
      }
    ]
  })
}


resource "aws_iam_role_policy_attachment" "ecs_policy_attachment" {
  role = aws_iam_role.ecs_role.name
  for_each = toset([
    // This policy adds logging + ecr permissions
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    # "arn:aws:iam::aws:policy/service-role/GetSecretValue",
    # "arn:aws:iam::aws:policy/service-role/GetSSMParamters",
    # "arn:aws:iam::aws:policy/service-role/CloudWatchFullAccess",
    aws_iam_policy.fargateTask.arn
  ])
  policy_arn = each.value
}
