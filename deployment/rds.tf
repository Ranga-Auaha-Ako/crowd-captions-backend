resource "aws_db_instance" "default" {
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "13.4"
  instance_class         = "db.t4g.micro"
  username               = replace(var.app_name, "/[^a-zA-Z0-9]/", "")
  password               = local.db_creds.password
  db_name                = replace(var.app_name, "/[^a-zA-Z0-9]/", "")
  parameter_group_name   = "default.postgres13"
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = ["${aws_security_group.rds_default.id}"]
  publicly_accessible    = false
  skip_final_snapshot    = true
}

resource "aws_db_subnet_group" "default" {
  name       = "main"
  subnet_ids = ["${data.aws_subnet.public_a.id}", "${data.aws_subnet.private_a.id}", "${data.aws_subnet.private_b.id}", "${data.aws_subnet.public_b.id}"]

  tags = {
    Name = "${var.app_name} DB subnet group"
  }
}

resource "aws_security_group" "rds_default" {
  name   = "security_group_${var.app_name}_rds_db"
  vpc_id = data.aws_vpc.uoa_raa.id
  egress = [
    {
      cidr_blocks = [
        "0.0.0.0/0",
      ]
      description      = ""
      from_port        = 0
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      protocol         = "-1"
      security_groups  = []
      self             = false
      to_port          = 0
    },
  ]
  ingress = [
    {
      cidr_blocks      = []
      from_port        = 5432
      to_port          = 5432
      description      = ""
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      protocol         = "tcp"
      security_groups = [
        data.aws_security_group.caprover.id,
        aws_security_group.security_group.id,
      ]
      self = true
    },
  ]

  lifecycle {
    create_before_destroy = true
  }
}
