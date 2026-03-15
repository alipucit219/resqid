import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { AppDispatch, RootState } from 'src/store'
import { DEFAULT_QR_ACCESS_PARAMS, fetchQrAccess, regenerateQrForUser } from 'src/store/apps/qrAccess'

const QrAccessPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const qrAccess = useSelector((state: RootState) => state.qrAccess)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [activeQr, setActiveQr] = useState<any>(null)

  useEffect(() => {
    dispatch(
      fetchQrAccess({
        ...DEFAULT_QR_ACCESS_PARAMS,
        page,
        limit: pageSize,
        search,
        userId: userIdFilter || undefined
      })
    )
  }, [dispatch, page, pageSize, search, userIdFilter])

  const columns = useMemo(
    () => [
      {
        flex: 0.3,
        minWidth: 260,
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
        flex: 0.2,
        minWidth: 190,
        field: 'lastGeneratedAt',
        headerName: 'Last Generated',
        renderCell: ({ row }: any) => (row?.lastGeneratedAt ? new Date(row.lastGeneratedAt).toLocaleString() : '—')
      },
      {
        flex: 0.2,
        minWidth: 140,
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        renderCell: ({ row }: any) => (
          <Button
            variant='contained'
            size='small'
            onClick={async () => {
              const userId = row?.user?.id
              if (!userId) return
              const res = await dispatch(regenerateQrForUser(userId))
              if (res.type.includes('fulfilled')) {
                setActiveQr((res as any).payload)
                setOpenDialog(true)
                toast.success('QR regenerated successfully')
                dispatch(
                  fetchQrAccess({
                    ...DEFAULT_QR_ACCESS_PARAMS,
                    page,
                    limit: pageSize,
                    search,
                    userId: userIdFilter || undefined
                  })
                )
                return
              }
              toast.error('Failed to regenerate QR')
            }}
          >
            Regenerate
          </Button>
        )
      }
    ],
    [dispatch, page, pageSize, search, userIdFilter]
  )

  return (
    <Card>
      <CardHeader title='QR Access' />
      <CardContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 3, mb: 4 }}>
          <TextField
            fullWidth
            size='small'
            label='Search by user'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <TextField
            fullWidth
            size='small'
            label='Filter by User ID'
            value={userIdFilter}
            onChange={e => setUserIdFilter(e.target.value)}
          />
        </Box>

        <DataGrid
          autoHeight
          rows={qrAccess.data}
          columns={columns as any}
          rowCount={qrAccess.total}
          page={page}
          pageSize={pageSize}
          pagination
          paginationMode='server'
          onPageChange={newPage => setPage(newPage)}
          onPageSizeChange={newSize => setPageSize(newSize)}
          rowsPerPageOptions={[10, 20, 50]}
          loading={qrAccess.isLoading}
          disableSelectionOnClick
        />
      </CardContent>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Generated QR</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 3, mt: 1 }}>
          {activeQr?.qrCodeDataUrl && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img src={activeQr.qrCodeDataUrl} alt='emergency-qr' style={{ width: 220, height: 220 }} />
            </Box>
          )}
          <Typography variant='body2'>Plain token is shown only once after generation.</Typography>
          <TextField label='Token' value={activeQr?.token || ''} InputProps={{ readOnly: true }} />
          <TextField label='Emergency URL' value={activeQr?.emergencyUrl || ''} InputProps={{ readOnly: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} variant='contained'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default QrAccessPage
