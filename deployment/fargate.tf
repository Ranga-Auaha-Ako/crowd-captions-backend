resource "aws_ecs_task_definition" "backend_task" {
  family = "backend_${var.app_name}_family_${terraform.workspace == "default" ? "staging" : terraform.workspace}"

  // Fargate is a type of ECS that requires awsvpc network_mode
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  // Valid sizes are shown here: https://aws.amazon.com/fargate/pricing/
  memory = "512"
  cpu    = "256"
  # https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecs_task_definition#:~:text=runtime_platform%20%7B%0A%20%20%20%20operating_system_family%20%3D%20%22WINDOWS_SERVER_2019_CORE%22%0A%20%20%20%20cpu_architecture%20%20%20%20%20%20%20%20%3D%20%22X86_64%22%0A%20%20%7D
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  // Fargate requires task definitions to have an execution role ARN to support ECR images
  execution_role_arn = aws_iam_role.ecs_role.arn
  task_role_arn      = aws_iam_role.ecs_role.arn

  container_definitions = jsonencode([
    {
      name      = "${var.app_name}_container_${terraform.workspace == "default" ? "staging" : terraform.workspace}",
      image     = "${aws_ecr_repository.ecr_repo.repository_url}:${var.app_version}",
      memory    = 512,
      essential = true,
      portMappings = [
        {
          containerPort = var.server_port,
          hostPort      = var.server_port
        }
      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = aws_cloudwatch_log_group.default.name,
          awslogs-region        = "ap-southeast-2",
          awslogs-stream-prefix = "awslogs-${var.app_name}"
        }
      },
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "ENV_TARGET", value = "${terraform.workspace == "default" ? "staging" : terraform.workspace}" },
        { name = "PORT", value = "${tostring(var.server_port)}" },
        { name = "POSTGRES_DB", value = replace(var.app_name, "/[^a-zA-Z0-9]/", "") },
        { name = "POSTGRES_USER", value = "${replace(var.app_name, "/[^a-zA-Z0-9]/", "")}" },
        { name = "POSTGRES_PASS", value = local.db_creds.password },
        { name = "POSTGRES_HOST", value = aws_db_instance.default.address },
        { name = "POSTGRES_PORT", value = "${tostring(aws_db_instance.default.port)}" },
        { name = "panopto_host", value = var.panopto_host },
        { name = "panopto_clientId", value = local.panopto_creds.client_id },
        { name = "panopto_clientSecret", value = local.panopto_creds.client_secret },
        { name = "JWT_SECRET", value = data.aws_secretsmanager_secret_version.jwt_secret.secret_string }
      ]
    }
  ])
  #   volume {
  #     name      = "service-storage"
  #     host_path = "/ecs/service-storage"
  #   }

}



resource "aws_ecs_cluster" "backend_cluster" {
  name = "backend_cluster_${var.app_name}_${terraform.workspace == "default" ? "staging" : terraform.workspace}"
}

resource "aws_ecs_service" "backend_service" {
  name = "backend_service_${var.app_name}_${terraform.workspace == "default" ? "staging" : terraform.workspace}"

  cluster          = aws_ecs_cluster.backend_cluster.id
  platform_version = "1.4.0"
  task_definition  = aws_ecs_task_definition.backend_task.arn

  launch_type   = "FARGATE"
  desired_count = 1

  network_configuration {
    subnets          = ["${data.aws_subnet.public_a.id}"]
    security_groups  = ["${aws_security_group.security_group.id}"]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_alb_target_group.main.arn
    container_name   = "${var.app_name}_container_${terraform.workspace == "default" ? "staging" : terraform.workspace}"
    container_port   = var.server_port
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
  depends_on = [
    aws_alb_target_group.main,
    aws_alb_listener.http,
    aws_alb_listener.https,
  ]
}

resource "aws_cloudwatch_log_group" "default" {
  name = "awslogs-${var.app_name}-${terraform.workspace == "default" ? "staging" : terraform.workspace}"
}

resource "aws_cloudwatch_log_group" "audit" {
  name = "${replace(var.app_name, "/[^a-zA-Z0-9]/", "")}-${terraform.workspace == "default" ? "staging" : terraform.workspace}"
}
