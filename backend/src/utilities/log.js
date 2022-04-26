import winston from "winston";
import WinstonCloudWatch from "winston-cloudwatch";
const env = process.env.NODE_ENV || "development";

// https://davidmcintosh.medium.com/winston-a-better-way-to-log-793ac19044c5
winston.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.align(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  })
);

if (env != "development") {
  winston.add(
    new WinstonCloudWatch({
      logGroupName: `crowdcaptions-${env}`,
      logStreamName: function () {
        // Spread log streams across dates as the server stays up
        let date = new Date().toISOString().split("T")[0];
        return (
          "express-server-" +
          date +
          "-" +
          crypto.createHash("md5").update(startTime).digest("hex")
        );
      },
    })
  );
}

module.exports = winston;
