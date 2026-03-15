// ** React Imports

// ** Context Imports

// ** MUI Imports
import { Button } from '@mui/material'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useDispatch } from 'react-redux'
import { getQrCode } from 'src/services/auth.service'
import { AppDispatch } from 'src/store'
import { setQrCode } from 'src/store/apps/auth'
import { setSecretKey } from 'src/store/apps/auth'
import TwoStepsV2POpup from '../enable-2fa'
import TwoStepsVerifyPopUp from '../verify'

const ACLPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  //const { user } = useSelector((state: any) => state?.auth)
  const userStringifiedData = window.localStorage.getItem('userData')
  let userDataObj

  if (userStringifiedData !== null) {
    userDataObj = JSON.parse(userStringifiedData)
  }

  const [loading, setLoading] = useState<boolean>(false)
  const [twoFapopUp, settwoFapopUp] = useState<boolean>(false)
  const [verifyTwoSteps, setverifyTwoSteps] = useState<boolean>(false)
  const toggle2faPopUp = () => settwoFapopUp(!twoFapopUp)
  const toggleVerifyTwoSteps = () => setverifyTwoSteps(!verifyTwoSteps)

  const enableGoogleAuth = async () => {
    setLoading(true)
    try {
      const res = await getQrCode()
      console.log(res?.data?.qrCode)
      dispatch(setQrCode(res?.data?.qrCode))
      dispatch(setSecretKey(res?.data?.secret))
      setLoading(false)
      settwoFapopUp(true)
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      toast.error(error?.response?.data?.message)
      setLoading(false)
      settwoFapopUp(false)
      console.log(error)
    }
  }
  const disableGoogleAuth = async () => {
    setverifyTwoSteps(true)
  }

  return (
    <Grid container spacing={6}>
      <Grid item md={12} xs={12}>
        <Card>
          <CardHeader title='Google Auth' />
          <CardContent>
            <Typography sx={{ mb: 4 }}>
              Google Authenticator generates dynamic passwords and it is similar to SMS dynamic verification. Google
              Authenticator generates a new code every 30 seconds after you link it to apps. This verification code can
              be used for higher security in the process of log-in, withdrawal, and changing security settings.
            </Typography>
            <Button
              onClick={userDataObj?.isTwoFactorAuthenticationEnabled ? disableGoogleAuth : enableGoogleAuth}
              disabled={loading ? true : false}
            >
              {userDataObj?.isTwoFactorAuthenticationEnabled ? 'Disable' : 'Enable'}
            </Button>
          </CardContent>
        </Card>
      </Grid>
      <TwoStepsV2POpup open={twoFapopUp} toggle={toggle2faPopUp} />
      <TwoStepsVerifyPopUp open={verifyTwoSteps} toggle={toggleVerifyTwoSteps} />
    </Grid>
  )
}

ACLPage.settings = {
  action: 'read',
  subject: 'acl-page'
}

export default ACLPage
