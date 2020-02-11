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

/**
 * Check if string is in ISO format
 * @param str the string to check
 */
export const isIsoDate = (str: string): Boolean => {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  var d = new Date(str);
  return d.toISOString() === str;
};
