import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'
import { enable2fa } from 'src/services/auth.service'

import { StoredUserType } from 'src/types/apps/userTypes'

// ** Third Party Imports
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

const useTwosteps = (toggle: any) => {
  // ** State
  const { qrCode, secretKey } = useSelector((state: any) => state?.auth)
  const [btnLoading, setBtnLoading] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  let storedUser: StoredUserType = JSON.parse(window.localStorage.getItem('userData') as any)

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
    reset,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const handleGoogleOtp = async (otp: string) => {
    const param = {
      twoFactorAuthenticationCode: otp
    }

    try {
      setBtnLoading(true)
      const response = await enable2fa(param)
      toast.success(response.data.message)
      setBtnLoading(false)
      storedUser = {
        ...storedUser,
        isTwoFactorAuthenticationEnabled: true
      }
      window.localStorage.setItem('userData', JSON.stringify(storedUser))
      handleClose()
    } catch (err: any) {
      setBtnLoading(false)
      toast.error(err?.response?.data?.message)
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

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false)
      }, 1000)
    }
  }, [copied])
  const handleItemAdddressCopy = () => {
    setCopied(true)
    navigator.clipboard.writeText(secretKey)
    toast.success('Seceret key is copied')
  }

  return {
    qrCode,
    btnLoading,
    handleGoogleOtp,
    handleClose,
    secretKey,
    errors,
    control,
    onSubmit,
    handleSubmit,
    handleItemAdddressCopy,
    copied
  }
}

export default useTwosteps
