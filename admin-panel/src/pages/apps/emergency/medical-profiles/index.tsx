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
  TextField
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import { AppDispatch, RootState } from 'src/store'
import {
  DEFAULT_MEDICAL_PROFILE_PARAMS,
  fetchMedicalProfiles,
  updateMedicalProfile
} from 'src/store/apps/medicalProfiles'

const MedicalProfilesPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const medicalProfiles = useSelector((state: RootState) => state.medicalProfiles)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [openEdit, setOpenEdit] = useState(false)
  const [activeRow, setActiveRow] = useState<any>(null)
  const [form, setForm] = useState<any>({
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    medications: '',
    pastSurgeries: '',
    emergencyNotes: ''
  })

  useEffect(() => {
    dispatch(
      fetchMedicalProfiles({
        ...DEFAULT_MEDICAL_PROFILE_PARAMS,
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
        flex: 0.25,
        minWidth: 240,
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
        minWidth: 120,
        field: 'bloodGroup',
        headerName: 'Blood Group'
      },
      {
        flex: 0.32,
        minWidth: 260,
        field: 'allergies',
        headerName: 'Allergies',
        renderCell: ({ row }: any) => <div>{(row?.allergies || []).join(', ') || '—'}</div>
      },
      {
        flex: 0.18,
        minWidth: 160,
        field: 'medications',
        headerName: 'Medications',
        renderCell: ({ row }: any) => <div>{(row?.medications || []).join(', ') || '—'}</div>
      },
      {
        flex: 0.12,
        minWidth: 120,
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        renderCell: ({ row }: any) => (
          <Button
            variant='outlined'
            size='small'
            onClick={() => {
              setActiveRow(row)
              setForm({
                bloodGroup: row?.bloodGroup || '',
                allergies: (row?.allergies || []).join(', '),
                chronicConditions: (row?.chronicConditions || []).join(', '),
                medications: (row?.medications || []).join(', '),
                pastSurgeries: (row?.pastSurgeries || []).join(', '),
                emergencyNotes: row?.emergencyNotes || ''
              })
              setOpenEdit(true)
            }}
          >
            Edit
          </Button>
        )
      }
    ],
    []
  )

  const handleSave = async () => {
    if (!activeRow?.user?.id) return
    const payload = {
      bloodGroup: form.bloodGroup || undefined,
      allergies: form.allergies
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean),
      chronicConditions: form.chronicConditions
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean),
      medications: form.medications
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean),
      pastSurgeries: form.pastSurgeries
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean),
      emergencyNotes: form.emergencyNotes || undefined
    }

    const res = await dispatch(updateMedicalProfile({ userId: activeRow.user.id, payload }))
    if (res.type.includes('fulfilled')) {
      toast.success('Medical profile updated')
      setOpenEdit(false)
      dispatch(
        fetchMedicalProfiles({
          ...DEFAULT_MEDICAL_PROFILE_PARAMS,
          page,
          limit: pageSize,
          search,
          userId: userIdFilter || undefined
        })
      )
      return
    }
    toast.error('Failed to update medical profile')
  }

  return (
    <Card>
      <CardHeader title='Medical Profiles' />
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
          rows={medicalProfiles.data}
          columns={columns as any}
          rowCount={medicalProfiles.total}
          page={page}
          pageSize={pageSize}
          pagination
          paginationMode='server'
          onPageChange={newPage => setPage(newPage)}
          onPageSizeChange={newSize => setPageSize(newSize)}
          rowsPerPageOptions={[10, 20, 50]}
          loading={medicalProfiles.isLoading}
          disableSelectionOnClick
        />
      </CardContent>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Edit Medical Profile</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 3, mt: 1 }}>
          <TextField label='Blood Group' value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} />
          <TextField
            label='Allergies (comma separated)'
            value={form.allergies}
            onChange={e => setForm({ ...form, allergies: e.target.value })}
          />
          <TextField
            label='Chronic Conditions (comma separated)'
            value={form.chronicConditions}
            onChange={e => setForm({ ...form, chronicConditions: e.target.value })}
          />
          <TextField
            label='Medications (comma separated)'
            value={form.medications}
            onChange={e => setForm({ ...form, medications: e.target.value })}
          />
          <TextField
            label='Past Surgeries (comma separated)'
            value={form.pastSurgeries}
            onChange={e => setForm({ ...form, pastSurgeries: e.target.value })}
          />
          <TextField
            label='Emergency Notes'
            multiline
            minRows={3}
            value={form.emergencyNotes}
            onChange={e => setForm({ ...form, emergencyNotes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} color='secondary'>
            Cancel
          </Button>
          <Button onClick={handleSave} variant='contained'>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default MedicalProfilesPage
