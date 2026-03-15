// ** Third Party Imports
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import toast from 'react-hot-toast'

// ** React
import { useState } from 'react'

// ** Redux
import { useDispatch } from 'react-redux'
import { AppDispatch } from 'src/store'
import { changePassword } from 'src/store/apps/user'

interface PasswordVisibilityType {
  currentPassword: boolean
  newPassword: boolean
  confirmPassword: boolean
}

// ** Form default values
const defaultValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}

const useChangePassword = () => {
  // ** State
  const [submitBtnDisableFlag, setSubmitBtnDiableFlag] = useState<boolean>(false)
  const [showPasswordVisibility, setShowPasswordVisibility] = useState<PasswordVisibilityType>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  })
  const dispatch = useDispatch<AppDispatch>()

  // Schema
  const schema = yup.object().shape({
    currentPassword: yup.string().required('Password is required'),
    newPassword: yup.string().required('New password is required').min(8, 'Password must be at least 8 characters'),
    confirmPassword: yup.string().required('Confirm password is required')
  })

  const {
    reset,
    control,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data: any) => {
    if (data?.newPassword !== data?.confirmPassword) {
      setError('confirmPassword', {
        message: 'Password must match'
      })
      return
    }
    setSubmitBtnDiableFlag(true)
    const { ...rest } = data
    const res = await dispatch(changePassword(rest))
    if (res?.type === 'appUsers/changePassword/fulfilled') {
      toast.success(res?.payload?.message)
      reset()
    }
    setSubmitBtnDiableFlag(false)
  }

  return {
    control,
    errors,
    handleSubmit,
    onSubmit,
    showPasswordVisibility,
    setShowPasswordVisibility,
    submitBtnDisableFlag
  }
}

export default useChangePassword
