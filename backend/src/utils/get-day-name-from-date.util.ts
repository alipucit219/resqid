import { dayNames } from "src/constants";

export function getDayNameFromDate(date: Date) {
  // Get the day index (0 for Sunday, 1 for Monday, etc.)
  const dayIndex = date.getDay();

  // Return the day name
  return dayNames[dayIndex];
}
