export const getTimeFromStart = (startTime) => {
  let startTimeSplited = startTime.split(",");

  let hoursMinutesSeconds = startTimeSplited[0];
  let milliseconds = startTimeSplited[1];

  let hoursMinutesSecondsSplited = hoursMinutesSeconds.split(":");

  return (
    Number(hoursMinutesSecondsSplited[0]) * 3600000 +
    Number(hoursMinutesSecondsSplited[1]) * 60000 +
    Number(hoursMinutesSecondsSplited[2]) * 1000 +
    Number(milliseconds)
  );
};
