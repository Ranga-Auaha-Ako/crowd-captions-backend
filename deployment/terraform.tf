data "aws_s3_bucket" "tf_state" {
  bucket = "uoa-raa-terraform-state"
}

# resource "aws_s3_bucket_acl" "state" {
#   bucket = data.aws_s3_bucket.tf_state.id
#   acl    = "private"
# }

terraform {
  backend "s3" {
    bucket = "uoa-raa-terraform-state"
    key    = "crowd-captions"
    region = "ap-southeast-2"
  }
}
