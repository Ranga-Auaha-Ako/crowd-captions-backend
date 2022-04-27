data "aws_subnet" "public_a" {
  id = "subnet-03e025981851ceeda"
}

data "aws_subnet" "public_b" {
  id = "subnet-0fbf5aef197de0f6c"
}

data "aws_subnet" "private_a" {
  id = "subnet-0b4713e4bd00527e5"
}


data "aws_subnet" "private_b" {
  id = "subnet-09cb2acdeec782ab8"
}

data "aws_security_group" "caprover" {
  id = "sg-047d956d55bac88d4"
}

data "aws_vpc" "uoa_raa" {
  id = data.aws_subnet.public_a.vpc_id
}

# resource "aws_internet_gateway" "internet_gateway" {
#     vpc_id = "${data.aws_vpc.uoa_raa.id}"
# }

# resource "aws_route" "internet_access" {
#     route_table_id = "${data.aws_vpc.uoa_raa.main_route_table_id}"
#     destination_cidr_block = "0.0.0.0/0"
#     gateway_id = "${aws_internet_gateway.internet_gateway.id}"
# }


resource "aws_security_group" "security_group" {
  name        = "security_group_${var.app_name}_${terraform.workspace == "default" ? "staging" : terraform.workspace}"
  description = "Allow TLS inbound traffic on port 80 (http)"
  vpc_id      = data.aws_vpc.uoa_raa.id

  ingress {
    from_port   = 80
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# # Certificate for domain
# resource "aws_acm_certificate" "cert" {
#   domain_name       = var.server_host
#   validation_method = "DNS"

#   tags = {
#     Environment = var.environment
#   }

#   lifecycle {
#     create_before_destroy = true
#   }
# }
