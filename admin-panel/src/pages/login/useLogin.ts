import { AppDispatch } from 'src/store'
// ** React Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { useRouter } from 'next/router'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useSelector } from 'react-redux'

import { useDispatch } from 'react-redux'
import useBgColor from 'src/@core/hooks/useBgColor'
import { useSettings } from 'src/@core/hooks/useSettings'
import { get2faAuthentication, handleUserLogin } from 'src/services/auth.service'

import { saveAccessToken, saveUserData, setIsTwofa } from 'src/store/apps/auth'
import * as yup from 'yup'
import { useTheme } from '@mui/material/styles'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'

interface loginProps {
  password: string
  email: string
}

interface State {
  password: string
  showPassword: boolean
}

const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { user, isTwofa } = useSelector((state: any) => state?.auth)

  // ** Hooks
  const theme = useTheme()
  const bgColors = useBgColor()
  const { settings } = useSettings()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const [rememberMe, setRememberMe] = useState<boolean>(true)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const [accessToken, setAccessToken] = useState<string>('')
  const [userData, setUserData] = useState('')
  const [forgetActive, setForgetActive] = useState<boolean>(false)

  const [state, setState] = useState<State>({
    password: '',
    showPassword: false
  })

  const handleClickShowPassword = () => {
    setState({ ...state, showPassword: !state.showPassword })
  }

  const handleTwoFaAfterLogin = async (otp: string) => {
    const data = {
      twoFactorAuthenticationCode: otp
    }
    try {
      const response = await get2faAuthentication(data)
      dispatch(saveAccessToken(accessToken as any))
      dispatch(saveUserData(userData as any))
      toast.success(response?.data?.message)
      router.push('/dashboards')
      setTimeout(() => {
        dispatch(setIsTwofa(false))
      }, 2000)
    } catch (error: any) {
      toast.error(error?.response?.data?.message)
    }
  }

  const defaultValues = {
    password: '',
    email: ''
  }
  const schema = yup.object().shape({
    email: yup.string().email('Must be a valid email').required('Email is required'),
    password: yup.string().min(8).required('Password is required')
  })

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues,
    mode: 'onBlur',
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data: loginProps) => {
    try {
      setLoading(true)
      const params = {
        email: data?.email,
        password: data?.password
      }
      const res = await handleUserLogin(params)
      if (res?.data?.user?.isTwoFactorAuthenticationEnabled) {
        window.localStorage.setItem('accessToken', res?.data?.accessToken)
        window.localStorage.setItem('userData', JSON.stringify(res?.data?.user))
        setAccessToken(res?.data?.accessToken)
        setUserData(res?.data?.user)
        dispatch(setIsTwofa(true))
      } else {
        window.localStorage.setItem('accessToken', res?.data?.accessToken)
        window.localStorage.setItem('userData', JSON.stringify(res?.data?.user))
        dispatch(saveAccessToken(res?.data?.accessToken))
        dispatch(saveUserData(res?.data?.user))
        toast.success(res?.data?.message)
        router.push('/dashboards')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message)
    }

    setLoading(false)
  }

  const { skin } = settings
  const imageSource = skin === 'bordered' ? 'auth-v2-login-illustration-bordered' : 'auth-v2-login-illustration'

  return {
    setRememberMe,
    rememberMe,
    showPassword,
    setShowPassword,
    bgColors,
    hidden,
    imageSource,
    theme,
    loading,
    user,
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
  }
}

export default useLogin
