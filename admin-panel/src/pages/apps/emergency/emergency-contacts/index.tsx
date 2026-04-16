import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
  FormControlLabel,
  Switch,
  TextField
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { AppDispatch, RootState } from 'src/store'
import {
  createEmergencyContact,
  DEFAULT_EMERGENCY_CONTACT_PARAMS,
  fetchEmergencyContacts
} from 'src/store/apps/emergencyContacts'

const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/

const EmergencyContactsPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const emergencyContacts = useSelector((state: RootState) => state.emergencyContacts)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [form, setForm] = useState({
    userId: '',
    name: '',
    phoneNumber: '',
    email: '',
    relationship: '',
    isPrimary: false
  })

  const reloadContacts = () => {
    dispatch(
      fetchEmergencyContacts({
        ...DEFAULT_EMERGENCY_CONTACT_PARAMS,
        page,
        limit: pageSize,
        search
      })
    )
  }

  useEffect(() => {
    reloadContacts()
  }, [dispatch, page, pageSize, search])

  const columns = useMemo(
    () => [
      {
        flex: 0.22,
        minWidth: 220,
        field: 'user',
        headerName: 'User',
        renderCell: ({ row }: any) => (
          <Box>
            <Link href={`/apps/user/view/${row?.user?.id || ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              {row?.user?.fullName || 'N/A'}
            </Link>
            <small>{row?.user?.email || ''}</small>
          </Box>
        )
      },
      {
        flex: 0.56,
        minWidth: 520,
        field: 'contacts',
        headerName: 'Emergency Contacts',
        sortable: false,
        renderCell: ({ row }: any) => (
          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {(row?.contacts || [])
              .map((contact: any) => `${contact.isPrimary ? 'Primary: ' : ''}${contact.name}${contact.email ? ` (${contact.email})` : ''}`)
              .join(' | ') || '—'}
          </Box>
        )
      },
      {
        flex: 0.1,
        minWidth: 100,
        field: 'totalContacts',
        headerName: 'Total'
      },
      {
        flex: 0.12,
        minWidth: 140,
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        renderCell: ({ row }: any) => (
          <Button component={Link} href={`/apps/user/view/${row?.user?.id || ''}`} variant='outlined' size='small'>
            View User
          </Button>
        )
      }
    ],
    []
  )

  const handleSubmit = async () => {
    if (!String(form.userId || '').trim()) {
      toast.error('User id is required')
      return
    }

    const payload = {
      name: String(form.name || '').trim(),
      phoneNumber: String(form.phoneNumber || '').trim(),
      email: String(form.email || '').trim() || undefined,
      relationship: String(form.relationship || '').trim() || undefined,
      isPrimary: Boolean(form.isPrimary)
    }

    if (!payload.name) {
      toast.error('Contact name is required')
      return
    }
    if (!payload.phoneNumber) {
      toast.error('Contact number is required')
      return
    }
    if (!PHONE_REGEX.test(payload.phoneNumber)) {
      toast.error('Contact number format is invalid')
      return
    }
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      toast.error('Email format is invalid')
      return
    }

    const res = await dispatch(createEmergencyContact({ userId: String(form.userId).trim(), payload }))

    if (res.type.includes('fulfilled')) {
      toast.success('Contact created')
      setOpenForm(false)
      setForm({ userId: '', name: '', phoneNumber: '', email: '', relationship: '', isPrimary: false })
      reloadContacts()
      return
    }

    toast.error('Failed to save contact')
  }

  return (
    <Card>
      <CardHeader
        title='Emergency Contacts'
        action={
          <Button
            variant='contained'
            onClick={() => {
              setForm({
                userId: '',
                name: '',
                phoneNumber: '',
                email: '',
                relationship: '',
                isPrimary: false
              })
              setOpenForm(true)
            }}
          >
            Add Contact
          </Button>
        }
      />
      <CardContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mb: 4 }}>
          <TextField
            fullWidth
            size='small'
            label='Search by user or contact'
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </Box>

        <DataGrid
          autoHeight
          rows={emergencyContacts.data}
          columns={columns as any}
          rowCount={emergencyContacts.total}
          page={page}
          pageSize={pageSize}
          pagination
          paginationMode='server'
          onPageChange={newPage => setPage(newPage)}
          onPageSizeChange={newSize => setPageSize(newSize)}
          rowsPerPageOptions={[10, 20, 50]}
          loading={emergencyContacts.isLoading}
          disableSelectionOnClick
        />
      </CardContent>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Add Contact</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 3, mt: 1 }}>
          <TextField
            label='User ID'
            value={form.userId}
            onChange={e => setForm({ ...form, userId: e.target.value })}
            helperText='Enter the profile owner user id.'
          />
          <TextField label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField
            label='Phone Number'
            value={form.phoneNumber}
            onChange={e => setForm({ ...form, phoneNumber: e.target.value.replace(/[^0-9()+\-\s]/g, '') })}
          />
          <TextField label='Email' value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <TextField
            label='Relationship'
            value={form.relationship}
            onChange={e => setForm({ ...form, relationship: e.target.value })}
          />
          <FormControlLabel
            control={<Switch checked={Boolean(form.isPrimary)} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} />}
            label='Primary Contact'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant='contained'>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default EmergencyContactsPage
