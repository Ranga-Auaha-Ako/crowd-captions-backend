resource "random_id" "vpc_id" {
  keepers = {
    # Generate a new id each time we switch to a new VPC
    vpc_id = "${data.aws_vpc.uoa_raa.id}"
  }
  byte_length = 4
}

data "aws_subnet" "public_a" {
  id = "subnet-06c65863acf3349c5"
}

data "aws_subnet" "public_b" {
  id = "subnet-032fd3b5134089b35"
}

data "aws_subnet" "private_a" {
  id = "subnet-0fed70da793671949"
}


data "aws_subnet" "private_b" {
  id = "subnet-028ed93ca67efe5df"
}

# data "aws_security_group" "caprover" {
#   id = "sg-047d956d55bac88d4"
# }

data "aws_vpc" "uoa_raa" {
  id = "vpc-04a3b19a64f18c9e0"
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
  name        = "security_group_${var.app_name}_${terraform.workspace == "default" ? "staging" : terraform.workspace}-${random_id.vpc_id.hex}"
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
