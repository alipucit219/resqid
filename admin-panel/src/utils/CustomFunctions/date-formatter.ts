import * as moment from 'moment'

export const dateFormatter = (date: moment.MomentInput) => {
  // Create a Moment.js object in UTC
  const utcDate = moment.utc(date)

  // Format the date as "12 August 2024"
  const formattedDate = utcDate.format('D MMMM YYYY')

  return formattedDate
}
