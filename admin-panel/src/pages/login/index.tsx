// ** React Imports
import { ReactNode } from 'react'
import { useEffect } from 'react'
// ** Next Imports

// ** MUI Components
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import FormHelperText from '@mui/material/FormHelperText'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Icon Imports

// ** Third Party Imports

// ** Layout Import
import BlankLayout from 'src/@core/layouts/BlankLayout'

// ** Demo Imports
import FooterIllustrationsV2 from 'src/views/pages/auth/FooterIllustrationsV2'
import PinInputExamples from '../enable-2fa/pinCode/pinCode'
import useLogin from './useLogin'
import useLoginStyles from './useLoginStyles'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Icon from 'src/@core/components/icon'
import FormControl from '@mui/material/FormControl'
import { Controller } from 'react-hook-form'
import ForegetPassword from './ForgetPassword'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

const LoginPage = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  const {
    setRememberMe,
    hidden,
    imageSource,
    theme,
    rememberMe,
    loading,
    isTwofa,
    handleTwoFaAfterLogin,
    handleClickShowPassword,
    state,
    forgetActive,
    setForgetActive,
    errors,
    onSubmit,
    handleSubmit,
    control
    //modeSwings
  } = useLogin()
  const { LoginIllustration, RightWrapper, FormControlLabel } = useLoginStyles()

  if (user && Object.keys(user).length > 0) {
    window.location.href = '/apps/user/list'
  }

  //logic to remove vertical scrollbar at lg
  const isLgOrAbove = useMediaQuery(theme.breakpoints.up('lg'))
  useEffect(() => {
    if (isLgOrAbove) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isLgOrAbove])

  return (
    <Box className='content-right' sx={{ backgroundColor: 'background.paper' }}>
      {!hidden ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            position: 'relative',
            alignItems: 'center',
            borderRadius: '20px',
            justifyContent: 'center',
            backgroundColor: 'customColors.bodyBg',
            margin: theme => theme.spacing(8, 0, 8, 8)
          }}
        >
          <LoginIllustration alt='login-illustration' src={`/images/pages/${imageSource}-${theme.palette.mode}.png`} />
          <FooterIllustrationsV2 />
        </Box>
      ) : null}
      <RightWrapper>
        <Box
          sx={{
            p: [6, 12],
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box sx={{ width: '100%', maxWidth: isLgOrAbove ? 400 : '100%' }}>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              {'dark' === 'dark' ? (
                <img width={150} alt='qr-code' src='/images/official-logo.png' />
              ) : (
                <img width={150} alt='qr-code' src='/images/official-logo.png' />
              )}
            </Box>

            {forgetActive ? (
              <ForegetPassword setForgetActive={setForgetActive} />
            ) : isTwofa ? (
              <Box>
                <Box sx={{ my: 6 }}>
                  <Typography sx={{ mb: 1.5, fontWeight: 500, fontSize: '1.625rem', lineHeight: 1.385 }}>
                    Welcome to RESQID
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>Please authenticate to your account</Typography>
                </Box>
                <PinInputExamples handleTwoFaAfterLogin={handleTwoFaAfterLogin} />
              </Box>
            ) : (
              <Box sx={{ width: '100%', maxWidth: 400 }}>
                <Box sx={{ my: 6 }}>
                  <Typography sx={{ mb: 1.5, fontWeight: 500, fontSize: '1.625rem', lineHeight: 1.385 }}>
                    Welcome to RESQID
                  </Typography>
                  <Typography sx={{ color: 'text.secondary' }}>Please sign-in to your account</Typography>
                </Box>

                <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)}>
                  <FormControl fullWidth sx={{ mb: 4 }}>
                    <Controller
                      name='email'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <TextField
                          autoFocus
                          label='Email'
                          value={value}
                          onBlur={onBlur}
                          onChange={onChange}
                          error={Boolean(errors.email)}
                          placeholder='admin@vuexy.com'
                        />
                      )}
                    />
                    {errors.email && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>
                    )}
                  </FormControl>

                  <FormControl fullWidth sx={{ mb: 4 }}>
                    <Controller
                      name='password'
                      control={control}
                      rules={{ required: true }}
                      render={({ field: { value, onChange } }) => (
                        <TextField
                          autoComplete='off'
                          autoSave='off'
                          type={state.showPassword ? 'text' : 'password'}
                          value={value}
                          label='Password'
                          onChange={onChange}
                          placeholder='......'
                          error={Boolean(errors.password)}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position='end'>
                                <IconButton
                                  edge='end'
                                  onClick={handleClickShowPassword}
                                  onMouseDown={e => e.preventDefault()}
                                  aria-label='toggle password visibility'
                                >
                                  <Icon icon={state?.showPassword ? 'tabler:eye' : 'tabler:eye-off'} />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      )}
                    />
                    {errors.password && (
                      <FormHelperText sx={{ color: 'error.main' }}>{errors.password.message}</FormHelperText>
                    )}
                  </FormControl>

                  <Box
                    sx={{
                      mb: 1.75,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <FormControlLabel
                      label='Remember Me'
                      control={<Checkbox checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />}
                    />
                    <Typography onClick={() => setForgetActive(true)} sx={{ cursor: 'pointer' }}>
                      Forgot Password?
                    </Typography>
                  </Box>
                  <Button
                    fullWidth
                    size='large'
                    type='submit'
                    variant='contained'
                    sx={{ mb: 4 }}
                    disabled={loading ? true : false}
                  >
                    Login
                  </Button>
                </form>
              </Box>
            )}
          </Box>
        </Box>
      </RightWrapper>
    </Box>
  )
}

LoginPage.getLayout = (page: ReactNode) => <BlankLayout>{page}</BlankLayout>

LoginPage.guestGuard = true

export default LoginPage
