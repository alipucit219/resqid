// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableHead from '@mui/material/TableHead'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import TableContainer from '@mui/material/TableContainer'
import moment from 'moment'
import { dashboardDummyData } from 'src/views/dashboards/dummy-data'

const RecentPayments = () => {
  const payments = dashboardDummyData.recentPaymentdata.payments

  const convertToUSNumber = (n: number) => {
    const formatted = (+n).toLocaleString('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })

    return formatted
  }

  return (
    <Card>
      <CardHeader title='Recent Payments' />
      <TableContainer sx={{ height: '450px', overflowY: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { py: 2, borderTop: theme => `1px solid ${theme.palette.divider}` } }}>
              <TableCell>Project</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Payment Source</TableCell>
              <TableCell>Payment Destination</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((row: any, index: number) => {
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
                    <Box sx={{ display: 'flex', alignItems: 'center', '& img': { mr: 4 } }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                          {row?.project?.name}
                        </Typography>
                        <Typography noWrap variant='body2' sx={{ color: 'text.disabled' }}>
                          {row?.client?.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography noWrap variant='body2' sx={{ color: 'text.disabled' }}>
                        {moment(row?.paymentDate).format('DD/MM/YYYY')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography noWrap sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {`${'$' + row.amount}`}
                      </Typography>
                      <Typography noWrap sx={{ fontWeight: 300, color: 'text.disabled' }}>
                        Rs {convertToUSNumber(row?.amount * row?.USDToPKR)}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography noWrap variant='body2' sx={{ color: 'text.disabled' }}>
                        {row?.paymentSource}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography noWrap variant='body2' sx={{ color: 'text.disabled' }}>
                        {row?.paymentDestination}
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

export default RecentPayments
