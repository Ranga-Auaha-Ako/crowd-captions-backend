resource "aws_lb" "main" {
  name               = "${var.app_name}-alb-${terraform.workspace == "default" ? "stg" : terraform.workspace}-${random_id.vpc_id.hex}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.security_group.id]
  subnets            = ["${data.aws_subnet.public_a.id}", "${data.aws_subnet.public_b.id}"]

  enable_deletion_protection = false
}

resource "aws_alb_target_group" "main" {
  name        = "${var.app_name}-tg-${terraform.workspace == "default" ? "stg" : terraform.workspace}-${random_id.vpc_id.hex}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = random_id.vpc_id.keepers.vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "3"
    path                = var.health_check_path
    unhealthy_threshold = "2"
  }

  lifecycle {
    create_before_destroy = true
  }

}

resource "aws_alb_listener" "http" {
  load_balancer_arn = aws_lb.main.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = 443
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_alb_listener" "https" {
  load_balancer_arn = aws_lb.main.id
  port              = 443
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-2016-08"
  certificate_arn = var.cert_arn

  default_action {
    target_group_arn = aws_alb_target_group.main.id
    type             = "forward"
  }
}
