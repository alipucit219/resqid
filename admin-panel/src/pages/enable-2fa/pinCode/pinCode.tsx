// ** Third Party Imports
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import OtpInput from 'react-otp-input'
import * as yup from 'yup'

// ** MUI Imports
import { Button, FormControl, FormHelperText } from '@mui/material'

const PinCodeInputs = props => {
  const { handleTwoFaAfterLogin } = props
  const defaultValues = {
    otp: ''
  }
  // Schema
  const schema = yup.object().shape({
    otp: yup
      .string()
      .matches(/^[0-9]+$/, 'OPT must be number')
      .required()
  })
  const {
    control,
    setError,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const onSubmit = (data: any) => {
    if (data?.otp.length < 6) {
      setError('otp', {
        message: 'OTP must be 6 digits'
      })
      return
    }
    handleTwoFaAfterLogin(data?.otp)
  }
  return (
    <div
      style={{
        width: '100%',
        height: '80px',
        backgroundColor: '#fff'
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
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
                inputStyle={{
                  height: '50px',
                  width: ' 20%',
                  borderRadius: '8px',
                  margin: '0 8px'
                }}
                renderInput={props => <input {...props} />}
              />
            )}
          />

          {errors.otp && <FormHelperText sx={{ color: 'error.main' }}>{errors.otp.message}</FormHelperText>}
        </FormControl>
        <Button fullWidth type='submit' variant='contained' sx={{ mt: 5 }}>
          Verify My Account
        </Button>
      </form>
    </div>
  )
}

export default PinCodeInputs
