/*
This file is the entry for the backend program
Currently it only link to server.js, but more files can be added as a import
This can turn each part of the backend into a stand alone component,
and allow easier update/modification
*/

require = require("esm")(module);

// Get Task ID if needed
const axios = require("axios");
const getTaskID = async () => {
  let taskID = "default";
  if (process.env.ECS_CONTAINER_METADATA_URI_V4) {
    const taskRes = await axios.get(
      `${process.env.ECS_CONTAINER_METADATA_URI_V4}/task`
    );
    console.log(
      `taskRes.data.TaskARN: ${JSON.stringify(taskRes.data.TaskARN)}`
    );
    console.log(`taskRes.data: ${JSON.stringify(taskRes.data)}`);
    if (taskRes.data.TaskARN) {
      taskID = taskRes.data.TaskARN.split(":")[5].split("/")[2];
    }
  }
  console.log(`Found task:${taskID}`);
  return taskID;
};

(async function () {
  const taskID = await getTaskID();
  // Add Fargate task ID to globals
  global.taskID = taskID;
  module.exports = require("./server.js");
})();
