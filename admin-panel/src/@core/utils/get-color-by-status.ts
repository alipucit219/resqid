// ** Var colors
export const colors = ['warning', 'primary', 'info', 'secondary', 'error', 'success']

// ** Get color by Kpi percentage
export const getColorByKpiPercentage = (val: number) => {
  if (val < 30) {
    return 'error'
  } else if (val >= 30 && val < 60) {
    return 'warning'
  } else if (val >= 60 && val < 80) {
    return 'info'
  } else {
    return 'success'
  }
}

// ** Get random color
export const getRandomColor = () => {
  const color = ['#7367F0', '#A8AAAE', '#EA5455', '#FF9F43', '#00CFE8', '#28C76F']
  const randomNumber = Math.floor(Math.random() * 6)
  return color[randomNumber]
}
