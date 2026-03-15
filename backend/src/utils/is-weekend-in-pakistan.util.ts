export function isWeekendInPakistan() {
  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    weekday: "short",
  }).format(new Date());

  return today === "Sat" || today === "Sun";
}
