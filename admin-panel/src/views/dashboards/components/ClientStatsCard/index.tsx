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
  const clientStat = dashboardDummyData.clientStats

  return (
    <>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='primary' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='mdi:account-group' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {clientStat.totalClients}
            </Typography>
            <Typography variant='body2'>Total Clients</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='info' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='mdi:account-multiple-check' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {clientStat.activeClients}
            </Typography>
            <Typography variant='body2'>Active Clients</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='error' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='mdi:account-multiple-minus' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {clientStat.inActiveClients}
            </Typography>
            <Typography variant='body2'>InActive Clients</Typography>
          </Box>
        </Box>
      </Grid>
    </>
  )
}

const ClienStatsCard = () => {
  return (
    <Card>
      <CardHeader title='Client Stats' sx={{ '& .MuiCardHeader-action': { m: 0, alignSelf: 'center' } }} />
      <CardContent>
        <Grid container>{renderStats()}</Grid>
      </CardContent>
    </Card>
  )
}

export default ClienStatsCard
