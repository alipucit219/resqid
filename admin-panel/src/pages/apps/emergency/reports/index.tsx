import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, Grid, List, ListItem, ListItemText, Typography } from '@mui/material'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

const ReportsPage = () => {
  const [reports, setReports] = useState<any>({
    totals: {
      users: 0,
      medicalProfiles: 0
    },
    bloodGroups: [],
    allergies: []
  })

  useEffect(() => {
    const getReports = async () => {
      try {
        const response = await apiClient.get('v2/admin/reports')
        setReports(response.data)
      } catch (error) {
        modifyError(error)
      }
    }

    getReports()
  }, [])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Blood Group Reports' subheader={`Users: ${reports.totals.users} | Profiles: ${reports.totals.medicalProfiles}`} />
          <CardContent>
            {reports.bloodGroups.length ? (
              <List disablePadding>
                {reports.bloodGroups.map((item: any) => (
                  <ListItem key={item.value} disableGutters divider>
                    <ListItemText primary={item.value} secondary={`${item.count} users`} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: 'text.secondary' }}>No blood group report data available.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader title='Allergy Reports' subheader='Users grouped by allergy entries' />
          <CardContent>
            {reports.allergies.length ? (
              <List disablePadding>
                {reports.allergies.map((item: any) => (
                  <ListItem key={item.value} disableGutters divider>
                    <ListItemText primary={item.value} secondary={`${item.count} users`} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography sx={{ color: 'text.secondary' }}>No allergy report data available.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ReportsPage
