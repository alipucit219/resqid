// ** MUI IMport
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import FileCopyIcon from '@mui/icons-material/FileCopy'
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone'
import { Dialog, FormControl, FormHelperText, Grid } from '@mui/material'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import 'cleave.js/dist/addons/cleave-phone.us'
import Icon from 'src/@core/components/icon'
import Loader from 'src/@core/components/spinner/loader'
import { useSettings } from 'src/@core/hooks/useSettings'
import useTwosteps from './useTwoSteps'

// ** Third Party Imports
import { Controller } from 'react-hook-form'
import OtpInput from 'react-otp-input'

interface enable2faTYpes {
  open: boolean
  toggle: () => void
}

const TwoStepsV2POpup = (props: enable2faTYpes) => {
  const { open, toggle } = props

  const { settings } = useSettings()

  // ** Var
  const { direction } = settings
  const {
    qrCode,
    btnLoading,
    handleSubmit,
    onSubmit,
    control,
    errors,
    handleClose,
    secretKey,
    handleItemAdddressCopy,
    copied
  } = useTwosteps(toggle)
  const arrowIcon = direction === 'ltr' ? 'tabler:chevron-right' : 'tabler:chevron-left'

  return (
    <Dialog
      fullWidth
      open={open}
      maxWidth='md'
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
          px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
          py: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
        }}
      >
        <IconButton size='small' onClick={handleClose} sx={{ position: 'absolute', right: '1rem', top: '1rem' }}>
          <Icon icon='tabler:x' />
        </IconButton>
        <div>
          <Typography variant='h5' sx={{ mb: 4, textAlign: 'center' }}>
            Enable 2FA Authentication
          </Typography>
          <Typography variant='h6'>Authenticator Apps</Typography>
          <Typography variant='body2' sx={{ mb: 4 }}>
            Using an authenticator app like Google Authenticator, Microsoft Authenticator, Authy, or 1Password, scan the
            QR code. It will generate a 6 digit code for you to enter below.
          </Typography>
          <Box sx={{ my: 12, display: 'flex', justifyContent: 'center' }}>
            {qrCode ? (
              <img width={150} height={150} alt='qr-code' src={qrCode} />
            ) : (
              <Typography variant='body2' sx={{ mb: 4 }}>
                No QR Code Available
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '60%', my: 2 }}>
            <Box sx={{ display: 'flex', columnGap: '1rem' }}>
              <AlertTitle sx={{ mb: 4 }}>Backup Key:</AlertTitle>
              <Typography variant='body2' sx={{ mb: 4 }}>
                {secretKey}
              </Typography>
            </Box>
            {copied ? (
              <FileDownloadDoneIcon className='font-small-4 me-50' />
            ) : (
              <FileCopyIcon className='font-small-4 me-50' onClick={handleItemAdddressCopy} />
            )}
          </Box>
          <Alert severity='warning' icon={false}>
            Warning: Save this backup key and don't disclose it to anyone.
            <Typography variant='h6'></Typography>
          </Alert>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              borderRadius: '20px',

              justifyContent: 'center',

              margin: theme => theme.spacing(5, 0, 5, 0)
            }}
          >
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
          </Box>
          <Grid container spacing={6}>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant='outlined' color='secondary' onClick={handleClose} sx={{ mr: 4 }}>
                Cancel
              </Button>
              <Button
                variant='contained'
                sx={{
                  width: '100%',
                  maxWidth: '170px',
                  minWidth: '170px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '60px'
                }}
                endIcon={<Icon icon={arrowIcon} />}
                onClick={handleSubmit(onSubmit)}
              >
                {btnLoading ? <Loader /> : 'Enable 2FA'}
              </Button>
            </Grid>
          </Grid>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TwoStepsV2POpup
