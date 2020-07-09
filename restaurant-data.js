const csv = require("csv-parser");
const fs = require("fs");

// used to extract opening and closing time
const timeRegexPattern = new RegExp(
  /((1[0-2]|0?[1-9]):?([0-5][0-9])? ?([AaPp][Mm]))/,
  "gi"
);

// used to extract data from days of the week
const daysOfWeek = new RegExp(
  /(Mon|Tues|Wed|Thu|Fri|Sat|Sun)-?(Mon|Tues|Wed|Thu|Fri|Sat|Sun)?/,
  "gi"
);

const daysOfWeekNames = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];

const results = [];

const getDaysInRange = (dayRange) => {
  const daysOfWeek = [];
  const [startDay, endDay] = dayRange;
  const startDayIndex = daysOfWeekNames.indexOf(startDay);
  const endDayIndex = daysOfWeekNames.indexOf(endDay);
  for (let startDay = startDayIndex; startDay <= endDayIndex; startDay++) {
    daysOfWeek.push(daysOfWeekNames[startDay]);
  }
  return daysOfWeek;
};

const formatDaysAndTimeData = (restaurantOpeningHours) => {
  return restaurantOpeningHours.map((data) => {
    const days = data
      .match(daysOfWeek)
      .map((day) => {
        let dayRange = day.split(/[-,]/);
        if (dayRange.length === 2) {
          dayRange = getDaysInRange(dayRange);
        }
        return dayRange;
      })
      .flat();
    const time = data.match(timeRegexPattern);

    return {
      days,
      storeHours: {
        openingHours: time[0],
        closingHours: time[1],
      },
    };
  });
};

const splitRestaurantData = (data) => {
  const splitData = data.openingHours.trim("").split("/");
  const restaurantData = {
    restaurantName: data.restaurantName,
    openingHours: splitData,
  };

  return restaurantData;
};

fs.createReadStream("restaurant-data.csv")
  .pipe(csv())
  .on("data", (data) => {
    const restaurantData = splitRestaurantData(data);
    restaurantData.openingHours = formatDaysAndTimeData(
      restaurantData.openingHours
    );
    // console.log(restaurantData);

    results.push(restaurantData);
  })
  .on("end", () => {});

module.exports = results;

// time.match(/Mon|Tues|Wed|Thu|Fri|Sat|Sun/gi);
