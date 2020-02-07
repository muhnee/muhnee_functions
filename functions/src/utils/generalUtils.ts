import moment from "moment";

export type DateRange = {
  startDate: moment.Moment;
  endDate: moment.Moment;
};

export const getDateRange = (
  currentDate: moment.Moment,
  summaryType: "week" | "month" | "year"
): DateRange => {
  let startDate = moment().startOf("week");
  let endDate = moment().endOf("week");

  switch (summaryType) {
    case "week":
      startDate = currentDate.subtract(1, "week");
      endDate = currentDate.endOf("day");
      break;
    case "month":
      startDate = currentDate.subtract(1, "month");
      endDate = currentDate.endOf("day");
      break;
    case "year":
      startDate = currentDate.subtract(1, "year");
      endDate = currentDate.endOf("day");
      break;
  }
  return {
    startDate,
    endDate
  };
};
