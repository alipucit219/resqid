export const isCurrentPSTPastElevenAM = () => {
  // Get the current date and time
  const now = new Date()

  // Convert the current time to Pakistan Standard Time (UTC+5)
  const nowPST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }))

  // Create a Date object representing 6 AM PST on the same day
  const elevenAM = new Date(nowPST)
  elevenAM.setHours(6, 0, 0, 0)

  // Check if the current time is greater than 6 AM PST
  return nowPST > elevenAM
}
