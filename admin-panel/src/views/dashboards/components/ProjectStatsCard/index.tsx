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
  const projectStat = dashboardDummyData.projectStats

  return (
    <>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='primary' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='carbon:ibm-cloud-projects' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {projectStat.activeProjects}
            </Typography>
            <Typography variant='body2'>Active Projects</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='info' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='arcticons:zoho-projects' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {projectStat.completedProjects}
            </Typography>
            <Typography variant='body2'>Completed Projects</Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={6} md={4}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar skin='light' color='warning' sx={{ mr: 2, width: 25, height: 25 }}>
            <Icon icon='codicon:project' fontSize={16} />
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {projectStat.totalProjects}
            </Typography>
            <Typography variant='body2'>Total Projects</Typography>
          </Box>
        </Box>
      </Grid>
    </>
  )
}

const ProjectStatsCard = () => {
  return (
    <Card>
      <CardHeader title='Projects' sx={{ '& .MuiCardHeader-action': { m: 0, alignSelf: 'center' } }} />
      <CardContent>
        <Grid container>{renderStats()}</Grid>
      </CardContent>
    </Card>
  )
}

export default ProjectStatsCard
