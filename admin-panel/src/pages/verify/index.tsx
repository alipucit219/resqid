// ** MUI Components
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

// ** Styles
import { Dialog, DialogContent, FormControl, FormHelperText, IconButton } from '@mui/material'
import 'cleave.js/dist/addons/cleave-phone.us'
import Icon from 'src/@core/components/icon'
import useDisableTwoSteps from './useDisableTwoSteps'

// ** Third Party Imports
import { Controller } from 'react-hook-form'
import OtpInput from 'react-otp-input'

// ** Styled Components
interface verify2faTypes {
  open: boolean
  toggle: () => void
}
const TwoStepsVerifyPopUp = (props: verify2faTypes) => {
  const { open, toggle } = props
  const { btnLoading, handleClose, control, errors, handleSubmit, onSubmit } = useDisableTwoSteps(toggle)

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='sm'
      scroll='body'
      onClose={handleClose}
      onBackdropClick={handleClose}
      aria-labelledby='alert-dialog-title'
      aria-describedby='alert-dialog-description'
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <DialogContent
        sx={{
          position: 'relative',
          px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(10)} !important`],
          py: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(8.5)} !important`]
        }}
      >
        <IconButton size='small' onClick={handleClose} sx={{ position: 'absolute', right: '1rem', top: '1rem' }}>
          <Icon icon='tabler:x' />
        </IconButton>
        <Box className='content-center'>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ my: 6, textAlign: 'CENTER' }}>
              <Typography sx={{ mb: 1.5, fontWeight: 500, fontSize: '1.625rem', lineHeight: 1.385 }}>
                Disable two-factor authentication 💬
              </Typography>
            </Box>
            <Typography sx={{ fontWeight: 500, color: 'text.secondary', textAlign: 'center' }}>
              Type your 6 digit security code from your authenticator app
            </Typography>
            <Box sx={{ mt: 4 }}>
              <FormControl fullWidth>
                <Controller
                  name='otp'
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, onChange } }) => (
                    <OtpInput
                      value={value}
                      inputType='password'
                      onChange={onChange}
                      numInputs={6}
                      shouldAutoFocus
                      containerStyle={{
                        display: 'flex',
                        justifyContent: 'center'
                      }}
                      inputStyle={{
                        height: '55px',
                        width: ' 55px',
                        borderRadius: '8px',
                        margin: '0 10px'
                      }}
                      renderInput={props => <input {...props} />}
                    />
                  )}
                />

                {errors.otp && <FormHelperText sx={{ color: 'error.main' }}>{errors.otp.message}</FormHelperText>}
              </FormControl>
              <Box sx={{ display: 'flex', justifyContent: 'end', mt: 5, columnGap: 2 }}>
                <Button type='submit' onClick={handleClose} variant='outlined' color='secondary'>
                  Cancel
                </Button>

                <Button type='submit' variant='contained' disabled={btnLoading} onClick={handleSubmit(onSubmit)}>
                  Disable
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default TwoStepsVerifyPopUp
