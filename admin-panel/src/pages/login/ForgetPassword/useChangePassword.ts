// ** React Imports
import toast from 'react-hot-toast'

import { requestPasswordReset } from 'src/services/auth.service'

import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'

// eslint-disable-next-line @typescript-eslint/no-unused-vars

interface changePasswordData {
  email: string
}

const useChangePassword = (setForgetActive: (prop: null | any) => void) => {
  // change password//

  const defaultValues = {
    email: ''
  }

  const schema = yup.object().shape({
    email: yup.string().email().required('Email must be a valid email')
  })

  const {
    reset,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data: changePasswordData) => {
    console.log('🚀 ~ file: useNewUser.ts:84 ~ onSubmit ~ data', data)
    try {
      const response = await requestPasswordReset(data)
      toast.success(response?.data?.message)
      reset()
      setForgetActive(false)
    } catch (error: string | any) {
      toast.error(error?.response?.data?.message)
    }
  }

  return {
    handleSubmit,
    onSubmit,
    errors,
    control
  }
}

export default useChangePassword
