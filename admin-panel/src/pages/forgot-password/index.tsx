import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Box, Button, Card, CardContent, CardHeader, TextField, Typography } from '@mui/material'
import toast from 'react-hot-toast'
import { requestPasswordReset } from 'src/services/auth.service'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) {
      toast.error('Email is required')
      return
    }

    try {
      setLoading(true)
      const response = await requestPasswordReset({ email: email.trim() })
      toast.success(response?.data?.message || 'Reset instructions sent.')
      setEmail('')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to send reset instructions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 4 }}>
      <Card sx={{ width: '100%', maxWidth: 460 }}>
        <CardHeader title='Forgot Password' subheader='Enter your account email to receive a reset link.' />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              autoFocus
              type='email'
              label='Email'
              value={email}
              onChange={event => setEmail(event.target.value)}
              sx={{ mb: 4 }}
            />
            <Button fullWidth type='submit' variant='contained' disabled={loading}>
              {loading ? 'Please wait...' : 'Send Reset Link'}
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

ForgotPasswordPage.guestGuard = true

export default ForgotPasswordPage
