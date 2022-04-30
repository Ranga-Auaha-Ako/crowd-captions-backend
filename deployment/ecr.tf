resource "aws_ecr_repository" "ecr_repo" {
  name = "${var.app_name}_repo_${terraform.workspace == "default" ? "staging" : terraform.workspace}"
}


output "ecr_name" {
  value = aws_ecr_repository.ecr_repo.name
}
