import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { disable2fa } from 'src/services/auth.service'
import { setQrCode, setSecretKey } from 'src/store/apps/auth'
import { AppDispatch } from 'src/store'

// ** Third Party Imports
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const useDisableTwoSteps = (toggle: any) => {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()

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
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  // ** State
  const [btnLoading, setBtnLoading] = useState<boolean>(false)

  const handleGoogleOtp = async (otp: string) => {
    const param = {
      twoFactorAuthenticationCode: otp
    }

    try {
      setBtnLoading(true)
      const response = await disable2fa(param)
      toast.success(response.data.message)
      setBtnLoading(false)
      dispatch(setQrCode(null as any))

      dispatch(setSecretKey(null as any))
      toggle()

      const loggedInUserData = JSON.parse(window.localStorage.getItem('userData') as string)
      loggedInUserData.isTwoFactorAuthenticationEnabled = false
      window.localStorage.setItem('userData', JSON.stringify(loggedInUserData))

      router.push('apps/user/list')
    } catch (err: any) {
      toast.error(err?.response?.data?.message)

      setBtnLoading(false)
    }
  }
  const onSubmit = async (data: any) => {
    if (data?.otp.length < 6) {
      setError('otp', {
        message: 'OTP must be 6 digits'
      })
      return
    }
    handleGoogleOtp(data?.otp)
  }
  const handleClose = () => {
    reset()
    toggle()
  }

  return {
    handleGoogleOtp,
    control,
    errors,
    onSubmit,
    handleSubmit,
    btnLoading,
    handleClose
  }
}

export default useDisableTwoSteps
