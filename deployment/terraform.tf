resource "aws_s3_bucket" "tf_state" {
  bucket = "uoa-raa-terraform-state"

  tags = {
    Name = "Terraform State for ${var.app_name}"
  }
}

resource "aws_s3_bucket_acl" "state" {
  bucket = aws_s3_bucket.tf_state.id
  acl    = "private"
}

terraform {
  backend "s3" {
    bucket = "uoa-raa-terraform-state"
    key    = "crowd-captions" // EDIT THIS BEFORE USING NEW PROJECT
    region = "ap-southeast-2"
  }
}
