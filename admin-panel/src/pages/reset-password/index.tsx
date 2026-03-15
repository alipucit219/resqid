import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Box, Button, Card, CardContent, CardHeader, TextField, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { resetPassword } from 'src/services/auth.service'

const ResetPasswordPage = () => {
  const router = useRouter()
  const token = useMemo(() => {
    const queryToken = router.query.token
    return Array.isArray(queryToken) ? queryToken[0] : queryToken || ''
  }, [router.query.token])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) {
      toast.error('Reset token is missing from URL.')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      const response = await resetPassword({
        token,
        newPassword
      })
      toast.success(response?.data?.message || 'Password reset successfully.')
      window.location.href = '/login'
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 4 }}>
      <Card sx={{ width: '100%', maxWidth: 460 }}>
        <CardHeader title='Reset Password' subheader='Set a new password for your account.' />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type='password'
              label='New Password'
              value={newPassword}
              onChange={event => setNewPassword(event.target.value)}
              sx={{ mb: 4 }}
            />
            <TextField
              fullWidth
              type='password'
              label='Confirm Password'
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              sx={{ mb: 4 }}
            />
            <Button fullWidth type='submit' variant='contained' disabled={loading}>
              {loading ? 'Please wait...' : 'Reset Password'}
            </Button>
          </form>
          <Typography sx={{ mt: 4, textAlign: 'center' }}>
            <Link href='/login'>Back to login</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

ResetPasswordPage.guestGuard = true

export default ResetPasswordPage
