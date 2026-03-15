// ** MUI Imports
import Card from '@mui/material/Card'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import { ApexOptions } from 'apexcharts'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'
import { Box } from '@mui/material'
import { dashboardDummyData } from 'src/views/dashboards/dummy-data'

const donutColors = {
  series1: '#fdd835',
  series2: '#00d4bd',
  series3: '#826bf8',
  series4: '#1FD5EB',
  series5: '#ffa1a1'
}

const CurrentMonthRatioChart = () => {
  const theme = useTheme()
  const monthlyRatio = dashboardDummyData.monthlyRatio

  const options: ApexOptions = {
    stroke: { width: 0 },
    labels: ['Total Profit', 'Total Expense', 'Total Payments In USD'],
    colors: [donutColors.series1, donutColors.series5, donutColors.series3],
    dataLabels: {
      enabled: false,
      formatter: (val: string) => `${parseInt(val, 10)}%`
    },
    legend: {
      position: 'bottom',
      markers: { offsetX: -3 },
      labels: { colors: theme.palette.text.secondary },
      itemMargin: {
        vertical: 3,
        horizontal: 10
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: false,
            name: {
              fontSize: '1.2rem'
            },
            value: {
              fontSize: '1.2rem',
              color: theme.palette.text.secondary
            },
            total: {
              show: true,
              fontSize: '1.2rem',
              label: 'Operational',
              formatter: () => '31%',
              color: theme.palette.text.primary
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 992,
        options: {
          chart: {
            height: 380
          },
          legend: {
            position: 'bottom'
          }
        }
      },
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 320
          },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name: {
                    fontSize: '1rem'
                  },
                  value: {
                    fontSize: '1rem'
                  },
                  total: {
                    fontSize: '1rem'
                  }
                }
              }
            }
          }
        }
      }
    ]
  }

  return (
    <Card>
      <CardHeader
        title='Current Month Ratio'
        subheader='Current month growth chart'
        subheaderTypographyProps={{ sx: { color: theme => `${theme.palette.text.disabled} !important` } }}
      />
      <CardContent sx={{ height: '425px' }}>
        {monthlyRatio.totalProfit === 0 || monthlyRatio.totalExpense === 0 || monthlyRatio.totalPaymentsInUSD === 0 ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '1.2rem',
              fontWeight: 900,
              height: '100%'
            }}
          >
            No Data
          </Box>
        ) : (
          <ReactApexcharts
            type='donut'
            height={400}
            options={options}
            series={[monthlyRatio.totalProfit, monthlyRatio.totalExpense, monthlyRatio.totalPaymentsInUSD]}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default CurrentMonthRatioChart
