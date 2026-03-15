import { useMemo } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
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
import { Line } from 'react-chartjs-2'
import Icon from 'src/@core/components/icon'
import useDashboard from './useDashboard'
import 'chart.js/auto'

type StatCardProps = {
  title: string
  value: string | number
  subtitle: string
  icon: string
  color: string
}

const StatCard = ({ title, value, subtitle, icon, color }: StatCardProps) => {
  return (
    <Card>
      <CardContent>
        <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={3}>
          <Box>
            <Typography variant='overline' sx={{ color: 'text.disabled' }}>
              {title}
            </Typography>
            <Typography variant='h5'>{value}</Typography>
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              color: '#fff',
              backgroundColor: color
            }}
          >
            <Icon icon={icon} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

const formatMoney = (value: number) =>
  Number(value || 0).toLocaleString('en-US', {
    maximumFractionDigits: 0
  })

const formatDateTime = (date: Date) =>
  date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

const formatOrderDate = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })

const getHotItemSubtitle = (item?: { totalQuantity?: number; totalSales?: number } | null) => {
  if (!item) return 'No finalized sales data'
  return `Qty ${Number(item.totalQuantity || 0)} | Sales Rs ${formatMoney(Number(item.totalSales || 0))}`
}

const Dashboard = () => {
  const theme = useTheme()
  const { data, error, isLoading, isRefreshing, lastUpdated, reload } = useDashboard()

  const orderFinalizeRate = useMemo(() => {
    if (!data.orders.total) return 0
    return Math.round((data.orders.finalized / data.orders.total) * 100)
  }, [data.orders.finalized, data.orders.total])

  const trendChartData: ChartData<'line'> = {
    labels: data.trend.map(item => item.label),
    datasets: [
      {
        label: 'Sales (Rs)',
        data: data.trend.map(item => item.sales),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 3
      },
      {
        label: 'Orders',
        data: data.trend.map(item => item.orders),
        borderColor: '#2563eb',
        backgroundColor: '#2563eb',
        fill: false,
        tension: 0.35,
        pointRadius: 3,
        yAxisID: 'y1'
      }
    ]
  }

  const trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        ticks: { color: theme.palette.text.disabled }
      },
      y1: {
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        ticks: { color: theme.palette.text.disabled }
      },
      x: {
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

  const topStaff = [...data.today.byStaff].sort((a, b) => Number(b.sales || 0) - Number(a.sales || 0)).slice(0, 8)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} justifyContent='space-between' alignItems='center'>
              <Box>
                <Typography variant='h4'>Restaurant Dashboard</Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Live POS stats from orders, tokens, menu, floor, and team modules
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
        <StatCard
          title='Total Orders'
          value={data.orders.total}
          subtitle={`Finalized ${data.orders.finalized} | Draft ${data.orders.draft}`}
          icon='tabler:shopping-cart'
          color='#0ea5e9'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Today Sale (Orders)'
          value={`Rs ${formatMoney(data.insights.todaySales)}`}
          subtitle={`Finalized Orders ${data.insights.todayFinalizedOrders}`}
          icon='tabler:currency-rupee'
          color='#16a34a'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Token Sales Today'
          value={`Rs ${formatMoney(data.today.sales)}`}
          subtitle={`Tokens ${data.today.tokens} | Qty ${data.today.quantity}`}
          icon='tabler:receipt'
          color='#059669'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Hot Item Today'
          value={data.insights.hotItemToday?.name || 'No Item'}
          subtitle={getHotItemSubtitle(data.insights.hotItemToday)}
          icon='tabler:flame'
          color='#dc2626'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Hot Item Week'
          value={data.insights.hotItemWeek?.name || 'No Item'}
          subtitle={getHotItemSubtitle(data.insights.hotItemWeek)}
          icon='tabler:flame'
          color='#b45309'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Hot Item Month'
          value={data.insights.hotItemMonth?.name || 'No Item'}
          subtitle={getHotItemSubtitle(data.insights.hotItemMonth)}
          icon='tabler:flame'
          color='#2563eb'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Menu Catalog'
          value={data.menu.dishes + data.menu.deals}
          subtitle={`Cat ${data.menu.categories} | Subcat ${data.menu.subcategories}`}
          icon='tabler:chef-hat'
          color='#7c3aed'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Dining Capacity'
          value={`${data.floor.seats} Seats`}
          subtitle={`Halls ${data.floor.halls} | Rooms ${data.floor.rooms} | Tables ${data.floor.tables}`}
          icon='tabler:armchair'
          color='#ea580c'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Team'
          value={`${data.team.staff} Staff`}
          subtitle={`Sessions ${data.team.loginSessions}`}
          icon='tabler:users-group'
          color='#0284c7'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Users'
          value={data.team.totalUsers}
          subtitle={`Active ${data.team.activeUsers} | Inactive ${data.team.inactiveUsers}`}
          icon='tabler:user-circle'
          color='#4f46e5'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Finalize Rate'
          value={`${orderFinalizeRate}%`}
          subtitle={`${data.orders.finalized} finalized out of ${data.orders.total}`}
          icon='tabler:lock-check'
          color='#0891b2'
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <StatCard
          title='Today Tokens'
          value={data.today.tokens}
          subtitle={`Processed quantity ${data.today.quantity}`}
          icon='tabler:ticket'
          color='#9333ea'
        />
      </Grid>

      <Grid item xs={12} lg={8}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title='7 Day Trend' subheader='Sales and order volume trend' />
          <CardContent sx={{ height: 340 }}>
            <Line data={trendChartData} options={trendChartOptions} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card sx={{ height: '100%' }}>
          <CardHeader title='Menu & Floor Snapshot' subheader='Core restaurant inventory and space setup' />
          <CardContent>
            <Stack spacing={2.2}>
              <Box>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2'>Categories</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {data.menu.categories}
                  </Typography>
                </Stack>
                <LinearProgress variant='determinate' value={Math.min(100, data.menu.categories * 5)} sx={{ mt: 1 }} />
              </Box>
              <Box>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2'>Subcategories</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {data.menu.subcategories}
                  </Typography>
                </Stack>
                <LinearProgress variant='determinate' value={Math.min(100, data.menu.subcategories * 3)} sx={{ mt: 1 }} />
              </Box>
              <Box>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2'>Dishes</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {data.menu.dishes}
                  </Typography>
                </Stack>
                <LinearProgress variant='determinate' value={Math.min(100, data.menu.dishes)} sx={{ mt: 1 }} />
              </Box>
              <Divider />
              <Box>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2'>Halls / Rooms</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {data.floor.halls} / {data.floor.rooms}
                  </Typography>
                </Stack>
              </Box>
              <Box>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2'>Tables / Seats</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {data.floor.tables} / {data.floor.seats}
                  </Typography>
                </Stack>
              </Box>
              <Box>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='body2'>Deals</Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    {data.menu.deals}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} lg={8}>
        <Card>
          <CardHeader title='Recent Orders' subheader='Latest order activity in register' />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Staff</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Qty</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                        No recent orders available.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>{order.customerName || '-'}</TableCell>
                      <TableCell>{order.generatedByStaff?.fullName || '-'}</TableCell>
                      <TableCell>{order.totalItems || 0}</TableCell>
                      <TableCell>{order.totalQuantity || 0}</TableCell>
                      <TableCell>Rs {formatMoney(order.totalAmount || 0)}</TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={order.isFinalized ? 'Finalized' : 'Draft'}
                          color={order.isFinalized ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{formatOrderDate(order.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>

      <Grid item xs={12} lg={4}>
        <Card>
          <CardHeader title='Today Staff Sales' subheader='Day-end token report by staff' />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff</TableCell>
                  <TableCell align='right'>Tokens</TableCell>
                  <TableCell align='right'>Qty</TableCell>
                  <TableCell align='right'>Sales</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {topStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                        No staff sales available for today.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  topStaff.map(item => (
                    <TableRow key={item.staffId}>
                      <TableCell>{item.staffName}</TableCell>
                      <TableCell align='right'>{item.tokens}</TableCell>
                      <TableCell align='right'>{item.quantity}</TableCell>
                      <TableCell align='right'>Rs {formatMoney(item.sales)}</TableCell>
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
