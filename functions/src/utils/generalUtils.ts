import moment from "moment";

export type DateRange = {
  startDate: moment.Moment;
  endDate: moment.Moment;
};

export const getDateRange = (
  currentDate: moment.Moment,
  summaryType: "week" | "month" | "year"
): DateRange => {
  switch (summaryType) {
    case "week":
      return {
        startDate: currentDate.subtract(1, "week").startOf("day"),
        endDate: currentDate.endOf("day")
      };
    case "month":
      return {
        startDate: currentDate.subtract(1, "month").startOf("day"),
        endDate: currentDate.endOf("day")
      };
    case "year":
      return {
        startDate: currentDate.subtract(1, "year").startOf("day"),
        endDate: currentDate.endOf("day")
      };
  }
};
