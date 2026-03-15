// ** MUI Import
import {
  Alert,
  AlertTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput
} from '@mui/material'
import Icon from 'src/@core/components/icon'

// ** Third Party Import
import { Controller } from 'react-hook-form'

// ** Hook
import useChangePassword from './useChangePassword'

const ChangePassword = () => {
  // ** Hook
  const {
    control,
    errors,
    handleSubmit,
    onSubmit,
    showPasswordVisibility,
    setShowPasswordVisibility,
    submitBtnDisableFlag
  } = useChangePassword()

  return (
    <Card>
      <CardHeader title='Change Password' />
      <CardContent>
        <Alert icon={false} severity='warning' sx={{ mb: 4 }}>
          <AlertTitle sx={{ fontWeight: 500, fontSize: '1.25rem', mb: theme => `${theme.spacing(2.5)} !important` }}>
            Ensure that these requirements are met
          </AlertTitle>
          Minimum 8 characters long, uppercase & symbol
        </Alert>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <FormControl sx={{ width: '49%' }}>
                <InputLabel htmlFor='user-password' error={Boolean(errors.currentPassword)}>
                  Password
                </InputLabel>
                <Controller
                  name='currentPassword'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <OutlinedInput
                      value={value}
                      label='Password'
                      onChange={onChange}
                      id='user-password'
                      error={Boolean(errors.currentPassword)}
                      type={showPasswordVisibility.currentPassword ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={() =>
                              setShowPasswordVisibility({
                                ...showPasswordVisibility,
                                currentPassword: !showPasswordVisibility.currentPassword
                              })
                            }
                            onMouseDown={e => e.preventDefault()}
                            aria-label='toggle password visibility'
                          >
                            <Icon icon={showPasswordVisibility.currentPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  )}
                />
                {errors.currentPassword && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.currentPassword.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor='user-new-password' error={Boolean(errors.newPassword)}>
                  New Password
                </InputLabel>
                <Controller
                  name='newPassword'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <OutlinedInput
                      value={value}
                      label='New Password'
                      onChange={onChange}
                      id='user-new-password'
                      error={Boolean(errors.newPassword)}
                      type={showPasswordVisibility.newPassword ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={() =>
                              setShowPasswordVisibility({
                                ...showPasswordVisibility,
                                newPassword: !showPasswordVisibility.newPassword
                              })
                            }
                            onMouseDown={e => e.preventDefault()}
                            aria-label='toggle password visibility'
                          >
                            <Icon icon={showPasswordVisibility.newPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  )}
                />
                {errors.newPassword && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.newPassword.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel htmlFor='user-confirm-new-password' error={Boolean(errors.confirmPassword)}>
                  Confirm New Password
                </InputLabel>
                <Controller
                  name='confirmPassword'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <OutlinedInput
                      value={value}
                      label='Confirm New Password'
                      onChange={onChange}
                      id='user-confirm-new-password'
                      error={Boolean(errors.confirmPassword)}
                      type={showPasswordVisibility.confirmPassword ? 'text' : 'password'}
                      endAdornment={
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={() =>
                              setShowPasswordVisibility({
                                ...showPasswordVisibility,
                                confirmPassword: !showPasswordVisibility.confirmPassword
                              })
                            }
                            onMouseDown={e => e.preventDefault()}
                            aria-label='toggle password visibility'
                          >
                            <Icon icon={showPasswordVisibility.confirmPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                  )}
                />
                {errors.confirmPassword && (
                  <FormHelperText sx={{ color: 'error.main' }}>{errors.confirmPassword.message}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button type='submit' variant='contained' disabled={submitBtnDisableFlag}>
                Change Password
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ChangePassword
