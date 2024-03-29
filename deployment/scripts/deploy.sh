#!/bin/sh
workspace=$(terraform workspace show)

if [ $# -eq 0 ]
  then
    if [ "$workspace" = "default" ]
      then
        terraform refresh -var-file=staging.tfvars
      else
        terraform refresh
    fi
  else
    terraform refresh -var-file=$1
fi
ecr_name=$(terraform output --raw ecr_name)
region=$(terraform output --raw region)
account_id=$(terraform output --raw account_id)
version=$(terraform output --raw version)

aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $account_id.dkr.ecr.$region.amazonaws.com
# docker build -t $ecr_name ../backend/ --platform linux/amd64
docker build -t $ecr_name ../backend/ --platform linux/arm64
docker tag $ecr_name $account_id.dkr.ecr.$region.amazonaws.com/$ecr_name:$version
docker push $account_id.dkr.ecr.$region.amazonaws.com/$ecr_name:$version

if [ $# -eq 0 ]
  then
    if [ "$workspace" = "default" ]
      then
        terraform refresh -var-file=staging.tfvars
      else
        terraform refresh
    fi
  else
    terraform refresh -var-file=$1
fi