function convertDateStringToTimestamp(dateString: string) {
  const inputDate = new Date(dateString);

  // Using toLocaleDateString
  const formattedDate = inputDate.toLocaleDateString("en-US");

  // Alternatively, using toISOString and extracting the date part
  const isoDateString = inputDate.toISOString().split("T")[0];

  const timeString = inputDate.toISOString().split("T")[1].replace("Z", "");
  const timezoneOffset = "+00";

  const formattedDateTimeString = `${isoDateString} ${timeString}${timezoneOffset}`;

  return formattedDateTimeString;
}
