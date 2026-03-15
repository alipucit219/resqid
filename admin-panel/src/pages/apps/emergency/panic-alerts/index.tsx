import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from 'src/store'
import { DEFAULT_PANIC_ALERT_PARAMS, fetchPanicAlertDetail, fetchPanicAlerts } from 'src/store/apps/panicAlerts'

const PanicAlertsPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const panicAlerts = useSelector((state: RootState) => state.panicAlerts)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [openDetail, setOpenDetail] = useState(false)

  useEffect(() => {
    dispatch(
      fetchPanicAlerts({
        ...DEFAULT_PANIC_ALERT_PARAMS,
        page,
        limit: pageSize,
        search,
        userId: userIdFilter || undefined,
        status,
        fromDate,
        toDate
      })
    )
  }, [dispatch, page, pageSize, search, userIdFilter, status, fromDate, toDate])

  const columns = useMemo(
    () => [
      {
        flex: 0.24,
        minWidth: 220,
        field: 'user',
        headerName: 'User',
        renderCell: ({ row }: any) => (
          <Box>
            <div>{row?.user?.fullName || 'N/A'}</div>
            <small>{row?.user?.email || ''}</small>
          </Box>
        )
      },
      {
        flex: 0.12,
        minWidth: 110,
        field: 'status',
        headerName: 'Status',
        renderCell: ({ row }: any) => {
          const status = String(row?.status || '')
          const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
            sent: 'success',
            partial: 'warning',
            failed: 'error',
            pending: 'info',
            logged_fallback: 'default'
          }
          return <Chip size='small' label={status || 'n/a'} color={colorMap[status] || 'default'} />
        }
      },
      {
        flex: 0.22,
        minWidth: 180,
        field: 'location',
        headerName: 'Location',
        renderCell: ({ row }: any) => (
          <a
            href={`https://maps.google.com/?q=${row?.latitude},${row?.longitude}`}
            target='_blank'
            rel='noreferrer'
          >
            {row?.latitude}, {row?.longitude}
          </a>
        )
      },
      {
        flex: 0.22,
        minWidth: 180,
        field: 'createdAt',
        headerName: 'Created',
        renderCell: ({ row }: any) => (row?.createdAt ? new Date(row.createdAt).toLocaleString() : '—')
      },
      {
        flex: 0.1,
        minWidth: 100,
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        renderCell: ({ row }: any) => (
          <Button
            variant='outlined'
            size='small'
            onClick={async () => {
              await dispatch(fetchPanicAlertDetail(row.id))
              setOpenDetail(true)
            }}
          >
            View
          </Button>
        )
      }
    ],
    [dispatch]
  )

  const detail = panicAlerts.activeDetail

  return (
    <Card>
      <CardHeader title='Panic Alerts' />
      <CardContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 220px 200px 180px 180px' }, gap: 3, mb: 4 }}>
          <TextField size='small' label='Search by user' value={search} onChange={e => setSearch(e.target.value)} />
          <TextField
            size='small'
            label='Filter by User ID'
            value={userIdFilter}
            onChange={e => setUserIdFilter(e.target.value)}
          />
          <TextField size='small' select label='Status' value={status} onChange={e => setStatus(e.target.value)}>
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='pending'>Pending</MenuItem>
            <MenuItem value='sent'>Sent</MenuItem>
            <MenuItem value='partial'>Partial</MenuItem>
            <MenuItem value='failed'>Failed</MenuItem>
            <MenuItem value='logged_fallback'>Fallback</MenuItem>
          </TextField>
          <TextField
            size='small'
            type='date'
            label='From Date'
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size='small'
            type='date'
            label='To Date'
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <DataGrid
          autoHeight
          rows={panicAlerts.data}
          columns={columns as any}
          rowCount={panicAlerts.total}
          page={page}
          pageSize={pageSize}
          pagination
          paginationMode='server'
          onPageChange={newPage => setPage(newPage)}
          onPageSizeChange={newSize => setPageSize(newSize)}
          rowsPerPageOptions={[10, 20, 50]}
          loading={panicAlerts.isLoading}
          disableSelectionOnClick
        />
      </CardContent>

      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} fullWidth maxWidth='md'>
        <DialogTitle>Panic Alert Detail</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2 }}>
          <Typography>
            <strong>User:</strong> {detail?.user?.fullName} ({detail?.user?.email})
          </Typography>
          <Typography>
            <strong>Status:</strong> {detail?.status}
          </Typography>
          <Typography>
            <strong>Fallback Used:</strong> {detail?.fallbackUsed ? 'Yes' : 'No'}
          </Typography>
          <Typography>
            <strong>Location:</strong> {detail?.latitude}, {detail?.longitude}
          </Typography>
          <Typography>
            <strong>Message:</strong> {detail?.message || '—'}
          </Typography>
          <Typography variant='h6' sx={{ mt: 2 }}>
            Dispatches
          </Typography>
          {(detail?.dispatches || []).map((dispatch: any) => (
            <Box key={dispatch.id} sx={{ border: '1px solid #eee', borderRadius: 1, p: 2 }}>
              <Typography>
                {dispatch.contactName} ({dispatch.phoneNumber})
              </Typography>
              <Typography variant='body2'>Status: {dispatch.status}</Typography>
              {dispatch.errorMessage && <Typography variant='body2'>Error: {dispatch.errorMessage}</Typography>}
              {dispatch.providerResponse && (
                <Typography variant='body2'>Provider: {dispatch.providerResponse}</Typography>
              )}
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetail(false)} variant='contained'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default PanicAlertsPage
