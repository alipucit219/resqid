import { getDayNameFromDate } from "./get-day-name-from-date.util";

export function isProvidedDateWeekend(date: Date) {
  const dayName = getDayNameFromDate(date);
  return ["Saturday", "Sunday"].includes(dayName);
}
