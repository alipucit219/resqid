import { Button, FormControl, FormHelperText, TextField, Typography } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'
import { Controller } from 'react-hook-form'
import useChangePassword from './useChangePassword'
import Icon from 'src/@core/components/icon'

interface Props {
  setForgetActive: (prop: null | any) => void
}
const ForegetPassword = (prop: Props) => {
  const { setForgetActive } = prop
  const { handleSubmit, onSubmit, errors, control } = useChangePassword(setForgetActive)

  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <Box>
        <Box sx={{ my: 6 }}>
          <Typography sx={{ mb: 1.5, fontWeight: 500, fontSize: '1.625rem', lineHeight: 1.385 }}>
            Forgot Password? 🔒
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Enter your email and we&prime;ll send you instructions to reset your password
          </Typography>
        </Box>
        <form onSubmit={handleSubmit(onSubmit)}>
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
            {errors.email && (
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              <FormHelperText sx={{ color: 'error.main' }}>{errors.email.message}</FormHelperText>
            )}
          </FormControl>
          <Button fullWidth size='large' type='submit' variant='contained' sx={{ mb: 4 }}>
            Send reset link
          </Button>
          <Typography sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { mr: 1 } }}>
            <Typography onClick={() => setForgetActive(false)} sx={{ cursor: 'pointer' }}>
              <Icon fontSize='1.25rem' icon='tabler:chevron-left' />
              <span>Back to login</span>
            </Typography>
          </Typography>
        </form>
      </Box>
    </Box>
  )
}

export default ForegetPassword
