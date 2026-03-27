import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { ChartData, ChartOptions } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'
import CardStatsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal'
import CardStatsWithAreaChart from 'src/@core/components/card-statistics/card-stats-with-area-chart'
import Icon from 'src/@core/components/icon'
import CustomChip from 'src/@core/components/mui/chip'
import useDashboard from './useDashboard'
import 'chart.js/auto'

const formatDateTime = (date: Date) =>
  date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

const formatAlertDate = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

const statusTitleMap: Record<string, string> = {
  pending: 'Pending',
  sent: 'Sent',
  partial: 'Partial',
  failed: 'Failed',
  logged_fallback: 'Fallback'
}

const statusChipColorMap: Record<string, 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  sent: 'success',
  partial: 'info',
  failed: 'error',
  logged_fallback: 'warning'
}

const Dashboard = () => {
  const theme = useTheme()
  const { data, error, isLoading, isRefreshing, lastUpdated, reload } = useDashboard()

  const trendChartData: ChartData<'line'> = {
    labels: data.alerts.trend.map(item => item.label),
    datasets: [
      {
        label: 'Panic Alerts',
        data: data.alerts.trend.map(item => item.total),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3
      }
    ]
  }

  const trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: theme.palette.text.disabled }
      },
      y: {
        ticks: { color: theme.palette.text.disabled }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: theme.palette.text.secondary
        }
      }
    }
  }

  const statusChartData: ChartData<'bar'> = {
    labels: ['Pending', 'Sent', 'Partial', 'Failed', 'Fallback'],
    datasets: [
      {
        label: 'Alerts by Status',
        data: [
          data.alerts.statusCounts.pending,
          data.alerts.statusCounts.sent,
          data.alerts.statusCounts.partial,
          data.alerts.statusCounts.failed,
          data.alerts.statusCounts.logged_fallback
        ],
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: ['#f59e0b', '#16a34a', '#0284c7', '#dc2626', '#7c3aed']
      }
    ]
  }

  const statusChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: theme.palette.text.disabled }
      },
      y: {
        ticks: { color: theme.palette.text.disabled }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent='space-between' alignItems='center'>
              <Box>
                <Typography variant='h4'>ResQID Admin Dashboard</Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Live emergency-system metrics for users, medical data, QR access, and panic alerts
                </Typography>
              </Box>

              <Stack direction='row' spacing={2} alignItems='center'>
                {lastUpdated ? (
                  <Chip
                    size='small'
                    variant='outlined'
                    label={`Updated: ${formatDateTime(lastUpdated)}`}
                    sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                  />
                ) : null}

                <Button
                  variant='contained'
                  onClick={reload}
                  disabled={isRefreshing}
                  startIcon={<Icon icon={isRefreshing ? 'tabler:loader' : 'tabler:refresh'} />}
                >
                  {isRefreshing ? 'Refreshing' : 'Refresh'}
                </Button>
              </Stack>
            </Stack>

            <Stack direction='row' spacing={2} sx={{ mt: 4, flexWrap: 'wrap', rowGap: 2 }}>
              <CustomChip rounded skin='light' size='small' color='success' label={`Profile Coverage ${data.coverage.profile}%`} />
              <CustomChip rounded skin='light' size='small' color='info' label={`Summary Coverage ${data.coverage.summary}%`} />
              <CustomChip rounded skin='light' size='small' color='secondary' label={`QR Coverage ${data.coverage.qr}%`} />
              <CustomChip rounded skin='light' size='small' color='warning' label={`Fallback Rate ${data.alerts.fallbackRate}%`} />
            </Stack>

            {isLoading ? <LinearProgress sx={{ mt: 3 }} /> : null}
          </CardContent>
        </Card>
      </Grid>

      {error ? (
        <Grid item xs={12}>
          <Alert severity='warning'>{error}</Alert>
        </Grid>
      ) : null}

      <Grid item xs={12} sm={6} lg={3}>
        <CardStatsHorizontal
          title='Users'
          stats={String(data.totals.users)}
          icon='tabler:users-group'
          avatarColor='primary'
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <CardStatsHorizontal
          title='Medical Profiles'
          stats={String(data.totals.medicalProfiles)}
          icon='tabler:stethoscope'
          avatarColor='success'
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <CardStatsHorizontal
          title='Medical Summaries'
          stats={String(data.totals.medicalSummaries)}
          icon='tabler:file-description'
          avatarColor='info'
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <CardStatsHorizontal
          title='Emergency Contacts'
          stats={String(data.totals.emergencyContacts)}
          icon='tabler:phone-call'
          avatarColor='warning'
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <CardStatsHorizontal
          title='QR Access Records'
          stats={String(data.totals.qrAccess)}
          icon='tabler:qrcode'
          avatarColor='secondary'
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <CardStatsHorizontal
          title='Panic Alerts'
          stats={String(data.totals.panicAlerts)}
          icon='tabler:alert-triangle'
          avatarColor='error'
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <CardStatsHorizontal
          title='Active Users'
          stats={String(data.totals.usersActive)}
          icon='tabler:user-check'
          avatarColor='success'
          sx={{ height: '100%' }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <CardStatsHorizontal
          title='Inactive Users'
          stats={String(data.totals.usersInactive)}
          icon='tabler:user-off'
          avatarColor='error'
          sx={{ height: '100%' }}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <CardStatsWithAreaChart
          title='Profiles Completed'
          stats={`${data.coverage.profile}%`}
          avatarIcon='tabler:heart-rate-monitor'
          avatarColor='success'
          chartColor='success'
          chartSeries={[{ data: [Math.max(0, data.coverage.profile - 18), Math.max(0, data.coverage.profile - 8), data.coverage.profile] }]}
          sx={{ height: '100%' }}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <CardStatsWithAreaChart
          title='Summaries Completed'
          stats={`${data.coverage.summary}%`}
          avatarIcon='tabler:notes'
          avatarColor='info'
          chartColor='info'
          chartSeries={[{ data: [Math.max(0, data.coverage.summary - 18), Math.max(0, data.coverage.summary - 8), data.coverage.summary] }]}
          sx={{ height: '100%' }}
        />
      </Grid>

      <Grid item xs={12} md={6} lg={4}>
        <CardStatsWithAreaChart
          title='Alert Success Rate'
          stats={`${data.alerts.sentSuccessRate}%`}
          avatarIcon='tabler:shield-check'
          avatarColor='primary'
          chartColor='primary'
          chartSeries={[{ data: [Math.max(0, data.alerts.sentSuccessRate - 18), Math.max(0, data.alerts.sentSuccessRate - 8), data.alerts.sentSuccessRate] }]}
          sx={{ height: '100%' }}
        />
      </Grid>

      <Grid item xs={12} lg={8}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title='Panic Alerts - 7 Day Trend' subheader={`Today ${data.alerts.today} | Last 7 Days ${data.alerts.last7Days}`} />
          <CardContent sx={{ height: 320 }}>
            <Line data={trendChartData} options={trendChartOptions} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title='Alert Status Distribution' subheader='Status split across all panic alerts' />
          <CardContent sx={{ height: 320 }}>
            <Bar data={statusChartData} options={statusChartOptions} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title='Recent Panic Alerts' subheader='Latest emergency alerts raised by users' />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Alert</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Fallback</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recentAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                        No panic alerts found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentAlerts.map(alert => (
                    <TableRow key={alert.id}>
                      <TableCell>#{alert.id}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant='body2'>{alert.user?.fullName || 'Unknown User'}</Typography>
                          <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                            {alert.user?.email || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <CustomChip
                          rounded
                          skin='light'
                          size='small'
                          color={statusChipColorMap[alert.status] || 'warning'}
                          label={statusTitleMap[alert.status] || alert.status}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size='small' label={alert.fallbackUsed ? 'Yes' : 'No'} color={alert.fallbackUsed ? 'warning' : 'success'} />
                      </TableCell>
                      <TableCell>{`${Number(alert.latitude || 0).toFixed(4)}, ${Number(alert.longitude || 0).toFixed(4)}`}</TableCell>
                      <TableCell>{formatAlertDate(alert.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  )
}

export default Dashboard
