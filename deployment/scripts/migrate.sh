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

region=$(terraform output --raw region)
cluster=$(terraform output --raw cluster)
containerName=$(terraform output --raw container_name)

taskList=$(aws ecs list-tasks --region $region --cluster $cluster --output text)
task="${taskList##*/}"

echo $task

aws ecs execute-command --region $region --cluster $cluster --task $task --container $containerName --command "/bin/sh -c 'cd /code/src; npx sequelize-cli db:migrate'" --interactive