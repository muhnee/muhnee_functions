import moment from "moment";

export type DateRange = {
  startDate: moment.Moment;
  endDate: moment.Moment;
};

export const getDateRange = (
  currentDate: moment.Moment,
  summaryType: "week" | "month" | "year"
): DateRange => {
  if (summaryType === "week") {
    return {
      startDate: moment(currentDate).subtract(1, "week"),
      endDate: moment(currentDate).endOf("day")
    };
  } else if (summaryType === "month") {
    return {
      startDate: moment(currentDate)
        .subtract(1, "month")
        .startOf("day"),
      endDate: moment(currentDate).endOf("day")
    };
  } else {
    return {
      startDate: moment(currentDate)
        .subtract(1, "year")
        .startOf("day"),
      endDate: moment(currentDate).endOf("day")
    };
  }
};
