import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
const env = process.env.NODE_ENV || "development";

// https://davidmcintosh.medium.com/winston-a-better-way-to-log-793ac19044c5
winston.add(
  new winston.transports.Console({
    format: winston.format.combine(
      // winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.json()
      // winston.format.align(),
      // winston.format.printf(
      //   (info) =>
      //     `${info.timestamp} ${info.level}: ${JSON.stringify(info.message)}`
      // )
    ),
  })
);

if (env != "development") {
  // Get Instance ID
  winston.add(
    new WinstonCloudWatch({
      jsonMessage: true,
      awsRegion: "ap-southeast-2",
      logGroupName: `crowdcaptions-${process.env.ENV_TARGET || "dev"}`,
      logStreamName: function () {
        // Spread log streams across dates as the server stays up
        let date = new Date().toISOString().split("T")[0];
        return `crowdcaptions-${date}-${global.taskID}`;
      },
    })
  );
}

module.exports = winston;
