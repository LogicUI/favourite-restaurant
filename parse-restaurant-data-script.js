const csv = require("csv-parser");
const fs = require("fs");
const moment = require("moment");
const connection = require("./db");
const async = require("async");
/**
 * This script is used to parse restaurant csv files and formats the data to insert it into the db
 */

// used to extract opening and closing time
const timeRegexPattern = new RegExp(
  /((1[0-2]|0?[1-9]):?([0-5][0-9])? ?([AaPp][Mm]))/,
  "gi"
);

// used to extract restaurant opening days from days of the week
const daysOfWeek = new RegExp(
  /(Mon|Tues|Wed|Thu|Fri|Sat|Sun)-?(Mon|Tues|Wed|Thu|Fri|Sat|Sun)?/,
  "gi"
);

const daysOfWeekNames = ["Mon", "Tues", "Wed", "Thu", "Fri", "Sat", "Sun"];

const restaurantDataArray = [];

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



const splitRestaurantData = (data) => {
  const splitData = data.restaurantHours.trim("").split("/");
  const restaurantData = {
    restaurantName: data.restaurantName,
    restaurantHours: splitData,
  };

  return restaurantData;
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
          openingTime: moment(time[0],["h:mm A"]).format("HH:mm"),
          closingTime: moment(time[1],["h:mm A"]).format("HH:mm"),
        },
      };
    });
  };


const flattenRestaurantHoursData = (restaurantOpeningHours,restaurantName) => {
    return restaurantOpeningHours.map((data)=> {
        const storeHours = data.days.map(days => {
            return [days,data.storeHours.openingTime, data.storeHours.closingTime,restaurantName]
        })
        return storeHours;
    }).reduce((acc,data) => {
        acc.push(...data);
        return acc;
    },[])
}

fs.createReadStream("restaurant-data.csv")
  .pipe(csv())
  .on("data", (data) => {
    const restaurantFormatedData = splitRestaurantData(data);
    restaurantFormatedData.restaurantHours = formatDaysAndTimeData(
      restaurantFormatedData.restaurantHours
    );
    restaurantFormatedData.restaurantHours = flattenRestaurantHoursData( restaurantFormatedData.restaurantHours, restaurantFormatedData.restaurantName);
    const itemExist = restaurantDataArray.find(restaurantData => restaurantData.restaurantName ===  restaurantFormatedData.restaurantName);
    // ensure no duplicates
    if(!itemExist){
      restaurantDataArray.push(restaurantFormatedData);
    }
  })
  .on("end", () => {
    async.forEach(restaurantDataArray,(restaurantData) =>{
        const restaurantNameSQL = "INSERT INTO restaurant (restaurant_name) VALUES (?)"
        connection.query(restaurantNameSQL, [restaurantData.restaurantName],(error,result) => {
          if(error){
            throw error;
          }
          console.log("i am successfully inserted as restaurant name")
        })
        const restaurantOperatingHoursSQL = "INSERT INTO restaurant_operating_hours (opening_days,opening_time,closing_time,restaurant_name) VALUES ?"
        connection.query(restaurantOperatingHoursSQL,[restaurantData.restaurantHours],(error,result) => {
            if(error){
              throw error;
            }
            console.log("i am successfully inserted as restaurant opperating hours")

        })
    })
  });



  
