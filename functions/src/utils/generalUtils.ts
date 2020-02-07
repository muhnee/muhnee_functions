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
      startDate: currentDate.subtract(1, "week"),
      endDate: currentDate.endOf("day")
    };
  } else if (summaryType === "month") {
    return {
      startDate: currentDate.subtract(1, "month").startOf("day"),
      endDate: currentDate.endOf("day")
    };
  } else {
    return {
      startDate: currentDate.subtract(1, "year").startOf("day"),
      endDate: currentDate.endOf("day")
    };
  }
};
