// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'
import { dashboardDummyData } from 'src/views/dashboards/dummy-data'

const renderStats = () => {
  const invoiceStat = dashboardDummyData.invoiceStats

  return (
    <>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='primary' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='mdi:invoice-text-multiple-outline' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {invoiceStat.totalInvoices}
            </Typography>
            <Typography variant='body2'>Total Invoices</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='info' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='mdi:invoice-text' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {invoiceStat.completedInvoices}
            </Typography>
            <Typography variant='body2'>Completed Invoices</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='warning' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='mdi:invoice-text-clock' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {invoiceStat.activeInvoices}
            </Typography>
            <Typography variant='body2'>Active Invoices</Typography>
          </Box>
        </Box>
      </Grid>
    </>
  )
}

const InvoiceStatsCard = () => {
  return (
    <Card>
      <CardHeader title='Invoices Stats' sx={{ '& .MuiCardHeader-action': { m: 0, alignSelf: 'center' } }} />
      <CardContent>
        <Grid container>{renderStats()}</Grid>
      </CardContent>
    </Card>
  )
}

export default InvoiceStatsCard
