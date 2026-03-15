import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import toast from 'react-hot-toast'
import { CircularProgress, Switch } from '@mui/material'
import Box, { BoxProps } from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import * as yup from 'yup'
import { useDispatch } from 'react-redux'
import { addUser, DEFAULT_USER_PARAMS, fetchUsers, updateUser } from 'src/store/apps/user'
import { singleUserDetail } from 'src/services/user.service'
import { AppDispatch } from 'src/store'
import FallbackSpinner from 'src/@core/components/spinner'

interface SidebarAddOrUpdateUserType {
  id: string | number | null
  type: 'Create' | 'Update'
  handleClose: () => void
  toggle: () => void
}

interface UserData {
  email: string
  fullName: string
  role: 'admin' | 'user'
  isActive: boolean
}

const Header = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(6),
  justifyContent: 'space-between'
}))

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' }
] as const

const SidebarAddUser = ({ type, id, handleClose, toggle }: SidebarAddOrUpdateUserType) => {
  const [loading, setLoading] = useState<boolean>(type === 'Update')
  const [submitBtnDisableFlag, setSubmitBtnDiableFlag] = useState<boolean>(false)

  const defaultValues: UserData = {
    email: '',
    fullName: '',
    role: 'user',
    isActive: true
  }

  const schema = yup.object().shape({
    email: yup.string().email().required(),
    fullName: yup.string().required().max(100, 'Name cannot be longer then 100 characters'),
    role: yup.string().oneOf(['admin', 'user']).required(),
    isActive: yup.boolean().required()
  })

  const dispatch = useDispatch<AppDispatch>()

  const {
    reset,
    control,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data: UserData) => {
    setSubmitBtnDiableFlag(true)

    const basePayload = {
      fullName: data.fullName,
      email: data.email,
      isActive: data.isActive
    }

    if (type === 'Create') {
      const res = await dispatch(
        addUser({
          ...basePayload,
          role: data.role
        })
      )
      if (res.type === 'appUsers/addUser/fulfilled') {
        toast.success('User created successfully')
        dispatch(fetchUsers(DEFAULT_USER_PARAMS))
      } else {
        const errorMessage =
          (res as any)?.payload?.response?.data?.message || (res as any)?.error?.message || 'Failed to create user'
        toast.error(errorMessage)
      }
    } else {
      const res = await dispatch(updateUser({ id, payload: basePayload }))
      if (res.type === 'appUsers/updateUser/fulfilled') {
        toast.success('Record updated successfully')
        dispatch(fetchUsers(DEFAULT_USER_PARAMS))
      } else {
        const errorMessage =
          (res as any)?.payload?.response?.data?.message || (res as any)?.error?.message || 'Failed to update user'
        toast.error(errorMessage)
      }
    }

    setSubmitBtnDiableFlag(false)
    reset(defaultValues)
    toggle()
    handleClose()
  }

  useEffect(() => {
    if (type === 'Update' && id) {
      singleUserDetail(id as number)
        .then(data => {
          setValue('fullName', data.fullName || '')
          setValue('email', data.email || '')
          setValue('isActive', Boolean(data.isActive))
          setValue('role', (data.role || 'user') as 'admin' | 'user')
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
          toast.error('Failed to load user details')
        })
    } else {
      setLoading(false)
    }
  }, [id, type, setValue])

  return (
    <Drawer
      open={true}
      anchor='right'
      variant='temporary'
      onClose={toggle}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      {loading ? (
        <FallbackSpinner />
      ) : (
        <>
          <Header>
            <Typography variant='h6'>{type === 'Create' ? 'Add' : 'Update'} User</Typography>
          </Header>
          <Box sx={{ p: theme => theme.spacing(0, 6, 6) }}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormControl fullWidth sx={{ mb: 4 }}>
                <Controller
                  name='fullName'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      value={value}
                      label='Full Name'
                      onChange={onChange}
                      placeholder='John Doe'
                      error={Boolean(errors.fullName)}
                    />
                  )}
                />
                {errors.fullName && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.fullName.message}</FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ mb: 4 }}>
                <Controller
                  name='email'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <TextField
                      type='email'
                      value={value}
                      label='Email'
                      onChange={onChange}
                      placeholder='johndoe@email.com'
                      error={Boolean(errors.email)}
                    />
                  )}
                />
                {errors.email && <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth sx={{ mb: 4 }}>
                <InputLabel id='validation-role-select' error={Boolean(errors.role)} htmlFor='validation-role-select'>
                  Role
                </InputLabel>
                <Controller
                  name='role'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <Select
                      value={value}
                      label='Role'
                      onChange={onChange}
                      disabled={type === 'Update'}
                      error={Boolean(errors.role)}
                      labelId='validation-role-select'
                      aria-describedby='validation-role-select'
                    >
                      {ROLE_OPTIONS.map(role => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.role && (
                  <FormHelperText sx={{ color: 'error.main' }} id='validation-role-select'>
                    Please select valid role
                  </FormHelperText>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ mb: 4 }}>
                <Typography>Is Active</Typography>
                <Controller
                  name='isActive'
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onChange={e => {
                        field.onChange((e.target as any)?.checked)
                      }}
                    />
                  )}
                />
              </FormControl>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button type='submit' variant='contained' sx={{ mr: 3 }} disabled={submitBtnDisableFlag}>
                  {submitBtnDisableFlag && <CircularProgress size={10} sx={{ mr: 3 }} />}
                  Submit
                </Button>
                <Button
                  variant='outlined'
                  color='secondary'
                  onClick={() => {
                    reset(defaultValues)
                    toggle()
                    handleClose()
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </Box>
        </>
      )}
    </Drawer>
  )
}

export default SidebarAddUser
