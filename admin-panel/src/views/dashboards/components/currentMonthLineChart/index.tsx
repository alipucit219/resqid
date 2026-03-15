// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import { Line } from 'react-chartjs-2'
import { ChartData, ChartOptions } from 'chart.js'
import { useTheme } from '@mui/material/styles'

// ** Third Party Styles Import
import 'chart.js/auto'
import { dashboardDummyData } from 'src/views/dashboards/dummy-data'

const CurrentMonthLineChart = () => {
  const theme = useTheme()
  const monthlyGraphdata = dashboardDummyData.monthlyGraphdata

  const months = monthlyGraphdata.map((item: any) => {
    const date = new Date(item?.createdAt)

    return date.toLocaleString('en-US', { month: 'long' })
  })

  const totalProfitData = monthlyGraphdata.map((item: any) => Number(item?.totalProfit))
  const totalExpenseData = monthlyGraphdata.map((item: any) => Number(item?.totalExpense))
  const totalPaymentsData = monthlyGraphdata.map((item: any) => Number(item?.totalPaymentsInUSD))

  const white = '#fff'
  const success = '#d4e157'
  const primary = '#8479F2'
  const warning = '#ff9800'
  const borderColor = theme.palette.divider
  const labelColor = theme.palette.text.disabled
  const legendColor = theme.palette.text.secondary

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: labelColor },
        grid: {
          color: borderColor
        }
      },
      y: {
        min: 0,
        max: 1000000,
        ticks: {
          stepSize: 100000,
          color: labelColor,
          callback: (value: any) => (value > 0 ? `${value / 100000}k` : 0)
        },
        grid: {
          color: borderColor
        }
      }
    },
    plugins: {
      legend: {
        align: 'end',
        position: 'top',
        labels: {
          padding: 25,
          boxWidth: 10,
          color: legendColor,
          usePointStyle: true
        }
      }
    }
  }

  const data: ChartData<'line'> = {
    labels: months,
    datasets: [
      {
        fill: false,
        tension: 0.5,
        pointRadius: 1,
        label: 'Total Profit',
        pointHoverRadius: 5,
        pointStyle: 'circle',
        borderColor: primary,
        backgroundColor: primary,
        pointHoverBorderWidth: 5,
        pointHoverBorderColor: white,
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: primary,
        data: totalProfitData
      },
      {
        fill: false,
        tension: 0.5,
        label: 'Total Expense',
        pointRadius: 1,
        pointHoverRadius: 5,
        pointStyle: 'circle',
        borderColor: warning,
        backgroundColor: warning,
        pointHoverBorderWidth: 5,
        pointHoverBorderColor: white,
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: warning,
        data: totalExpenseData
      },
      {
        fill: false,
        tension: 0.5,
        pointRadius: 1,
        label: 'Total Payments In USD',
        pointHoverRadius: 5,
        pointStyle: 'circle',
        borderColor: success,
        backgroundColor: success,
        pointHoverBorderWidth: 5,
        pointHoverBorderColor: white,
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: success,
        data: totalPaymentsData
      }
    ]
  }

  return (
    <Card>
      <CardHeader title='Current Month' subheader='Commercial networks & enterprises' />
      <CardContent>
        <Line data={data} height={400} options={options} />
      </CardContent>
    </Card>
  )
}

export default CurrentMonthLineChart
