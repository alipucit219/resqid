// ** React Imports
import { useState, useEffect, MouseEvent, useCallback } from 'react'

// ** Next Imports
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Menu from '@mui/material/Menu'
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import { DataGrid } from '@mui/x-data-grid'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import CardContent from '@mui/material/CardContent'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { CardHeader } from '@mui/material'
import TableHeader from 'src/views/apps/user/list/TableHeader'
import CustomDeleteConfirmationDialog from 'src/views/components/dialogs/CustomDeleteConfirmationDialog'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** Spinner Import
import FallbackSpinner from 'src/@core/components/spinner'

// ** Actions Imports
import { fetchUsers, deleteUser, DEFAULT_USER_PARAMS } from 'src/store/apps/user'

// ** Types Imports
import { RootState, AppDispatch } from 'src/store'
import { ThemeColor } from 'src/@core/layouts/types'
import { StaffType, UsersType } from 'src/types/apps/userTypes'

// ** Custom Table Components Imports
//import TableHeader from 'src/views/apps/user/list/TableHeader'
import AddUserDrawer from 'src/views/apps/user/list/AddUserDrawer'
import { toast } from 'react-hot-toast'
import { useDebounce } from 'src/hooks/useDebounce'

interface UserStatusType {
  [key: string]: ThemeColor
}

interface CellType {
  row: UsersType
}

// const userRoleObj: UserRoleType = {
//   admin: { icon: 'tabler:device-laptop', color: 'secondary' },
//   author: { icon: 'tabler:circle-check', color: 'success' },
//   editor: { icon: 'tabler:edit', color: 'info' },
//   maintainer: { icon: 'tabler:chart-pie-2', color: 'primary' },
//   subscriber: { icon: 'tabler:user', color: 'warning' }
// }

const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary'
}

// ** renders client column
const renderClient = (row: UsersType | StaffType) => {
  return (
    <CustomAvatar skin='light' sx={{ mr: 2.5, width: 38, height: 38, fontSize: '1rem', fontWeight: 500 }}>
      {getInitials(row.fullName ? row.fullName : 'John Doe')}
    </CustomAvatar>
  )
}

const RowOptions = (props: any) => {
  // ** Props
  const { id, setSidebarState, setAddUserOpen } = props

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>()

  // ** State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false)

  const rowOptionsOpen = Boolean(anchorEl)

  const handleRowOptionsClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleRowOptionsClose = () => {
    setAnchorEl(null)
  }

  const handleDelete = async (flag: boolean) => {
    const res = await dispatch(deleteUser(id))
    if (flag === true) {
      if (res.type === 'appUsers/deleteUser/fulfilled') {
        toast.success('User deleted successfully')
      }
      dispatch(fetchUsers(DEFAULT_USER_PARAMS))
    }
    setShowDeleteDialog(false)
    handleRowOptionsClose()
  }

  const handleClickEdit = () => {
    setAddUserOpen((prevFlagValue: any) => !prevFlagValue)
    setSidebarState((prevState: any) => {
      return {
        ...prevState,
        id,
        type: 'Update'
      }
    })
    handleRowOptionsClose()
  }

  return (
    <>
      <IconButton size='small' onClick={handleRowOptionsClick}>
        <Icon icon='tabler:dots-vertical' />
      </IconButton>
      {showDeleteDialog && <CustomDeleteConfirmationDialog handleDelete={handleDelete} />}
      <Menu
        keepMounted
        anchorEl={anchorEl}
        open={rowOptionsOpen}
        onClose={handleRowOptionsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{ style: { minWidth: '8rem' } }}
      >
        <MenuItem onClick={handleClickEdit} sx={{ '& svg': { mr: 2 } }}>
          <Icon icon='tabler:edit' fontSize={20} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => setShowDeleteDialog(true)} sx={{ '& svg': { mr: 2 } }}>
          <Icon icon='tabler:trash' fontSize={20} />
          Delete
        </MenuItem>
      </Menu>
    </>
  )
}
interface ISidebarState {
  id: number | null
  type: 'Create' | 'Update'
}

const UserList = () => {
  // ** State
  const [roleId, setRoleId] = useState<number>(0)
  const [name, setName] = useState<string>('')
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false)
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [sidebarState, setSidebarState] = useState<ISidebarState>({
    id: null,
    type: 'Create'
  })

  const columns = [
    {
      flex: 0.25,
      minWidth: 280,
      field: 'user',
      headerName: 'User',
      renderCell: ({ row }: CellType) => {
        const { fullName, email } = row

        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderClient(row)}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', flexDirection: 'column' }}>
              <Typography
                component={Link}
                href={`/apps/user/view/${row?.id}`}
                sx={{
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: 'text.secondary',
                  '&:hover': { color: 'primary.main' }
                }}
              >
                {fullName}
              </Typography>
              <Typography noWrap variant='body2' sx={{ color: 'text.disabled' }}>
                {email}
              </Typography>
            </Box>
          </Box>
        )
      }
    },
    {
      flex: 0.15,
      field: 'role',
      minWidth: 170,
      headerName: 'Role',
      renderCell: ({ row }: CellType) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <CustomAvatar
              skin='light'
              sx={{ mr: 4, width: 30, height: 30 }}
              color={(userRoleObj[`${row?.role?.name}`]?.color as ThemeColor) || 'primary'}
            >
              <Icon icon={userRoleObj[`${row?.role?.name}`]?.icon || 'tabler:device-laptop'} />
            </CustomAvatar> */}
            <Typography noWrap sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
              {row?.role || ''}
            </Typography>
          </Box>
        )
      }
    },
    {
      flex: 0.1,
      minWidth: 110,
      field: 'isActive',
      headerName: 'Status',
      renderCell: ({ row }: CellType) => {
        return (
          <CustomChip
            rounded
            skin='light'
            size='small'
            label={row.isActive ? 'Active' : 'Inactive'}
            color={userStatusObj[row.isActive ? 'active' : 'inactive']}
            sx={{ textTransform: 'capitalize' }}
          />
        )
      }
    },
    {
      flex: 0.1,
      minWidth: 100,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({ row }: CellType) => (
        <RowOptions id={row.id} setSidebarState={setSidebarState} setAddUserOpen={setAddUserOpen} />
      )
    }
  ]

  const handleClose = () => {
    setSidebarState(prevState => {
      return {
        ...prevState,
        id: null,
        type: 'Create'
      }
    })
  }

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>()
  const debouncedSearchTerm = useDebounce(name, 500)

  // ** Side effects
  useEffect(() => {
    dispatch(fetchUsers({ roleId, limit: pageSize, page, name: debouncedSearchTerm }))
  }, [dispatch, roleId, pageSize, page, debouncedSearchTerm])

  useEffect(() => {
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }, [])

  // ** Redux state
  const users = useSelector((state: RootState) => state.user)

  const toggleAddUserDrawer = () => {
    setAddUserOpen(!addUserOpen)
  }

  return (
    <Grid container spacing={6.5}>
      {loading ? (
        <Grid
          container
          spacing={0}
          direction='column'
          alignItems='center'
          justifyContent='center'
          style={{ minHeight: '100vh' }}
        >
          <Grid item xs={3}>
            <FallbackSpinner />
          </Grid>
        </Grid>
      ) : (
        <>
          <>
            <Grid item xs={12}>
              <Card>
                <CardHeader title='Search Filters' />

                <Divider sx={{ m: '0 !important' }} />
                <TableHeader toggle={toggleAddUserDrawer} value={name} handleFilter={name => setName(name)} />
                <DataGrid
                  autoHeight
                  rowHeight={62}
                  columns={columns}
                  rows={users?.data ? users?.data : []}
                  disableSelectionOnClick
                  rowCount={users?.total}
                  rowsPerPageOptions={[10, 15, 20]}
                  pagination
                  page={page}
                  pageSize={pageSize}
                  paginationMode='server'
                  onPageChange={newPage => setPage(newPage)}
                  onPageSizeChange={newPageSize => setPageSize(newPageSize)}
                  loading={users.isLoading}
                  localeText={{
                    noRowsLabel: 'There are no records to display'
                  }}
                />
              </Card>
            </Grid>
          </>

          {addUserOpen && (
            <AddUserDrawer
              id={sidebarState.id}
              type={sidebarState.type}
              handleClose={handleClose}
              toggle={toggleAddUserDrawer}
            />
          )}
        </>
      )}
    </Grid>
  )
}

export default UserList
