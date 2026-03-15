// ** React Imports
import { Box, LinearProgress } from '@mui/material'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableHead from '@mui/material/TableHead'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import { dashboardDummyData } from 'src/views/dashboards/dummy-data'

const KpiTopAndLowerCard = () => {
  const data = dashboardDummyData.kpi

  const convertToFixedDecimal = (n: number) => {
    const formatted = (+n).toLocaleString('en-US', {
      minimumFractionDigits: 1
    })

    return formatted
  }

  return (
    <Card>
      <CardHeader title='KPIs' />
      <TableContainer sx={{ height: '450px', overflowY: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { py: 2, borderTop: theme => `1px solid ${theme.palette.divider}` } }}>
              <TableCell>Employee</TableCell>
              <TableCell>Over all Score</TableCell>
              <TableCell>Department</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item: any, index: number) => {
              return (
                <TableRow
                  key={index}
                  sx={{
                    '&:last-child .MuiTableCell-root': { pb: theme => `${theme.spacing(6)} !important` },
                    '& .MuiTableCell-root': { border: 0, py: theme => `${theme.spacing(2.25)} !important` },
                    '&:first-of-type .MuiTableCell-root': { pt: theme => `${theme.spacing(4.5)} !important` }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography sx={{ fontWeight: 500 }}>{item.fullName}</Typography>
                      <Typography variant='body2' sx={{ color: 'text.disabled' }}>
                        {item.designation}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LinearProgress
                        value={item.scorePercentage}
                        variant='determinate'
                        color={item.progressColor}
                        sx={{ mr: 4, height: 8, width: 80 }}
                      />
                      <Typography sx={{ color: 'text.disabled' }}>{`${convertToFixedDecimal(item.scorePercentage)}%`}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {item?.department}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default KpiTopAndLowerCard
