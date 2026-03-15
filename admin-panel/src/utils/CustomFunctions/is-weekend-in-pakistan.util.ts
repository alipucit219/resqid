export function isWeekendInPakistan() {
  // Get the current date in the 'Asia/Karachi' timezone
  const today = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'short'
  }).format(new Date())

  // Check if today is Saturday ('Sat') or Sunday ('Sun')
  return today === 'Sat' || today === 'Sun'
}
