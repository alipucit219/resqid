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
  deleteEmergencyContact,
  fetchEmergencyContacts,
  updateEmergencyContact
} from 'src/store/apps/emergencyContacts'

const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/

const EmergencyContactsPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const emergencyContacts = useSelector((state: RootState) => state.emergencyContacts)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [openForm, setOpenForm] = useState(false)
  const [activeRow, setActiveRow] = useState<any>(null)
  const [form, setForm] = useState<any>({
    userId: '',
    name: '',
    phoneNumber: '',
    email: '',
    relationship: '',
    isPrimary: false
  })

  useEffect(() => {
    dispatch(
      fetchEmergencyContacts({
        ...DEFAULT_EMERGENCY_CONTACT_PARAMS,
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
        flex: 0.2,
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
        flex: 0.15,
        minWidth: 150,
        field: 'name',
        headerName: 'Contact Name'
      },
      {
        flex: 0.15,
        minWidth: 160,
        field: 'phoneNumber',
        headerName: 'Phone'
      },
      {
        flex: 0.2,
        minWidth: 200,
        field: 'email',
        headerName: 'Email'
      },
      {
        flex: 0.15,
        minWidth: 140,
        field: 'relationship',
        headerName: 'Relationship'
      },
      {
        flex: 0.1,
        minWidth: 100,
        field: 'isPrimary',
        headerName: 'Primary',
        renderCell: ({ row }: any) => (row?.isPrimary ? 'Yes' : 'No')
      },
      {
        flex: 0.15,
        minWidth: 180,
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        renderCell: ({ row }: any) => (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant='outlined'
              size='small'
              onClick={() => {
                setActiveRow(row)
                setForm({
                  userId: row?.user?.id || '',
                  name: row?.name || '',
                  phoneNumber: row?.phoneNumber || '',
                  email: row?.email || '',
                  relationship: row?.relationship || '',
                  isPrimary: Boolean(row?.isPrimary)
                })
                setOpenForm(true)
              }}
            >
              Edit
            </Button>
            <Button
              variant='outlined'
              color='error'
              size='small'
              onClick={async () => {
                if (!row?.user?.id) return
                const res = await dispatch(deleteEmergencyContact({ userId: row.user.id, contactId: row.id }))
                if (res.type.includes('fulfilled')) {
                  toast.success('Contact deleted')
                  if (activeRow?.id === row.id) {
                    setOpenForm(false)
                    setActiveRow(null)
                    setForm({ userId: '', name: '', phoneNumber: '', email: '', relationship: '', isPrimary: false })
                  }
                  dispatch(
                    fetchEmergencyContacts({
                      ...DEFAULT_EMERGENCY_CONTACT_PARAMS,
                      page,
                      limit: pageSize,
                      search,
                      userId: userIdFilter || undefined
                    })
                  )
                  return
                }
                toast.error('Failed to delete contact')
              }}
            >
              Delete
            </Button>
          </Box>
        )
      }
    ],
    [dispatch, page, pageSize, search, userIdFilter, activeRow]
  )

  const handleSubmit = async () => {
    if (!form.userId) {
      toast.error('User id is required')
      return
    }

    const payload = {
      name: form.name,
      phoneNumber: form.phoneNumber,
      email: form.email || undefined,
      relationship: form.relationship || undefined,
      isPrimary: Boolean(form.isPrimary)
    }

    if (!payload.name?.trim()) {
      toast.error('Contact name is required')
      return
    }
    if (!payload.phoneNumber?.trim()) {
      toast.error('Contact number is required')
      return
    }
    if (!PHONE_REGEX.test(payload.phoneNumber.trim())) {
      toast.error('Contact number format is invalid')
      return
    }
    if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      toast.error('Email format is invalid')
      return
    }

    const res =
      activeRow?.id && activeRow?.user?.id
        ? await dispatch(updateEmergencyContact({ userId: activeRow.user.id, contactId: activeRow.id, payload }))
        : await dispatch(createEmergencyContact({ userId: form.userId, payload }))

    if (res.type.includes('fulfilled')) {
      toast.success(activeRow?.id ? 'Contact updated' : 'Contact created')
      setOpenForm(false)
      setActiveRow(null)
      setForm({ userId: '', name: '', phoneNumber: '', email: '', relationship: '', isPrimary: false })
      dispatch(
        fetchEmergencyContacts({
          ...DEFAULT_EMERGENCY_CONTACT_PARAMS,
          page,
          limit: pageSize,
          search,
          userId: userIdFilter || undefined
        })
      )
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
              setActiveRow(null)
              setForm({ userId: '', name: '', phoneNumber: '', email: '', relationship: '', isPrimary: false })
              setOpenForm(true)
            }}
          >
            Add Contact
          </Button>
        }
      />
      <CardContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 3, mb: 4 }}>
          <TextField
            fullWidth
            size='small'
            label='Search by user/contact'
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
        <DialogTitle>{activeRow?.id ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 3, mt: 1 }}>
          {!activeRow?.id && (
            <TextField
              label='User ID'
              value={form.userId}
              onChange={e => setForm({ ...form, userId: e.target.value })}
              helperText='Mongo user id for the profile owner'
            />
          )}
          <TextField label='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField
            label='Phone Number'
            value={form.phoneNumber}
            onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
          />
          <TextField
            label='Email'
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label='Relationship'
            value={form.relationship}
            onChange={e => setForm({ ...form, relationship: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(form.isPrimary)}
                onChange={e => setForm({ ...form, isPrimary: e.target.checked })}
              />
            }
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
