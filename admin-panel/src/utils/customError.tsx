// ** Rect toast
import { toast } from 'react-hot-toast'

const modifyError = (err: any) => {
  if (Array.isArray(err?.response?.data?.message)) {
    const res = err?.response?.data?.message[0] || 'Something Went Wrong.Request Failed!'
    toast.error(res)
  } else {
    const errorMessage: any = err?.response?.message
      ? err?.response?.message
      : err?.response?.data?.message
      ? err?.response?.data?.message
      : 'Something Went Wrong.Request Failed!'
    toast.error(errorMessage)
  }
}

export default modifyError
