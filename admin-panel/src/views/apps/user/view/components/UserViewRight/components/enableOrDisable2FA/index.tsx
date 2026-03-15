// ** MUI Import

import { Button, Card, CardContent, CardHeader, Typography } from '@mui/material'

// ** Next
import Link from 'next/link'

const EnableOrDisable2FA = () => {
  return (
    <Card>
      <CardHeader title='Two-factor verification' />
      <CardContent>
        <Typography sx={{ mb: 6, width: ['100%', '90%'], color: 'text.secondary' }}>
          Two factor Authenticator generates dynamic passwords and it is similar to SMS dynamic verification. Two factor
          Authenticator generates a new code every 30 seconds after you link it to apps. This verification code can be
          used for higher security in the process of log-in, withdrawal, and changing security settings.
        </Typography>
        <Button variant='contained' component={Link} href={`/googleAuth`}>
          Enable two-factor authentication
        </Button>
      </CardContent>
    </Card>
  )
}

export default EnableOrDisable2FA
