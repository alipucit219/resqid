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
  DEFAULT_MEDICAL_SUMMARY_PARAMS,
  fetchMedicalSummaries,
  updateMedicalSummary
} from 'src/store/apps/medicalSummaries'

const PDF_FILE_REGEX = /\.pdf([?#].*)?$/i

const MedicalSummariesPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const medicalSummaries = useSelector((state: RootState) => state.medicalSummaries)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [openEdit, setOpenEdit] = useState(false)
  const [activeRow, setActiveRow] = useState<any>(null)
  const [form, setForm] = useState<any>({
    hospitalName: '',
    doctorName: '',
    diseaseStartingYear: '',
    treatmentDuration: '',
    treatmentStatus: '',
    checkupFiles: '',
    currentMedications: '',
    notes: ''
  })

  useEffect(() => {
    dispatch(
      fetchMedicalSummaries({
        ...DEFAULT_MEDICAL_SUMMARY_PARAMS,
        page,
        limit: pageSize,
        search
      })
    )
  }, [dispatch, page, pageSize, search])

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
            <small style={{ display: 'block' }}>{row?.user?.id || ''}</small>
          </Box>
        )
      },
      {
        flex: 0.2,
        minWidth: 160,
        field: 'hospitalName',
        headerName: 'Hospital'
      },
      {
        flex: 0.2,
        minWidth: 160,
        field: 'doctorName',
        headerName: 'Doctor'
      },
      {
        flex: 0.12,
        minWidth: 120,
        field: 'diseaseStartingYear',
        headerName: 'Disease Since'
      },
      {
        flex: 0.2,
        minWidth: 150,
        field: 'treatmentStatus',
        headerName: 'Status'
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
                hospitalName: row?.hospitalName || '',
                doctorName: row?.doctorName || '',
                diseaseStartingYear:
                  row?.diseaseStartingYear !== undefined && row?.diseaseStartingYear !== null
                    ? String(row.diseaseStartingYear)
                    : '',
                treatmentDuration: row?.treatmentDuration || '',
                treatmentStatus: row?.treatmentStatus || '',
                checkupFiles: (row?.checkupFiles || []).join(', '),
                currentMedications: (row?.currentMedications || []).join(', '),
                notes: row?.notes || ''
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
    const year = form.diseaseStartingYear ? Number(form.diseaseStartingYear) : undefined
    if (
      year !== undefined &&
      (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear())
    ) {
      toast.error(`Disease starting year must be between 1900 and ${new Date().getFullYear()}`)
      return
    }
    const payload = {
      hospitalName: form.hospitalName || undefined,
      doctorName: form.doctorName || undefined,
      diseaseStartingYear: year,
      treatmentDuration: form.treatmentDuration || undefined,
      treatmentStatus: form.treatmentStatus || undefined,
      checkupFiles: form.checkupFiles
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean),
      currentMedications: form.currentMedications
        .split(',')
        .map((x: string) => x.trim())
        .filter(Boolean),
      notes: form.notes || undefined
    }
    if (payload.checkupFiles.some((item: string) => !PDF_FILE_REGEX.test(item))) {
      toast.error('Checkup files must be PDF files (.pdf)')
      return
    }

    const res = await dispatch(updateMedicalSummary({ userId: activeRow.user.id, payload }))
    if (res.type.includes('fulfilled')) {
      toast.success('Medical summary updated')
      setOpenEdit(false)
      dispatch(
        fetchMedicalSummaries({
          ...DEFAULT_MEDICAL_SUMMARY_PARAMS,
          page,
          limit: pageSize,
          search
        })
      )
      return
    }
    toast.error('Failed to update medical summary')
  }

  return (
    <Card>
      <CardHeader title='Medical Summaries' />
      <CardContent>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3, mb: 4 }}>
          <TextField
            fullWidth
            size='small'
            label='Search by user'
            value={search}
            onChange={e => setSearch(e.target.value)}
            helperText='User ID is shown under each email in the User column'
          />
        </Box>

        <DataGrid
          autoHeight
          rows={medicalSummaries.data}
          columns={columns as any}
          rowCount={medicalSummaries.total}
          page={page}
          pageSize={pageSize}
          pagination
          paginationMode='server'
          onPageChange={newPage => setPage(newPage)}
          onPageSizeChange={newSize => setPageSize(newSize)}
          rowsPerPageOptions={[10, 20, 50]}
          loading={medicalSummaries.isLoading}
          disableSelectionOnClick
        />
      </CardContent>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Edit Medical Summary</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 3, mt: 1 }}>
          <TextField label='Hospital Name' value={form.hospitalName} onChange={e => setForm({ ...form, hospitalName: e.target.value })} />
          <TextField label='Doctor Name' value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} />
          <TextField
            label='Disease Starting Year'
            value={form.diseaseStartingYear}
            onChange={e => setForm({ ...form, diseaseStartingYear: e.target.value.replace(/[^0-9]/g, '') })}
          />
          <TextField
            label='Treatment Duration'
            value={form.treatmentDuration}
            onChange={e => setForm({ ...form, treatmentDuration: e.target.value })}
          />
          <TextField label='Treatment Status' value={form.treatmentStatus} onChange={e => setForm({ ...form, treatmentStatus: e.target.value })} />
          <TextField
            label='Checkup Files (comma separated PDF URLs or names)'
            value={form.checkupFiles}
            onChange={e => setForm({ ...form, checkupFiles: e.target.value })}
          />
          <TextField
            label='Current Medications (comma separated)'
            value={form.currentMedications}
            onChange={e => setForm({ ...form, currentMedications: e.target.value })}
          />
          <TextField
            label='Notes'
            multiline
            minRows={3}
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
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

export default MedicalSummariesPage
