// ** MUI Import
import { Grid } from '@mui/material'

// ** Custom Components
import ChangePassword from './components/changePassowrd'
import EnableOrDisable2FA from './components/enableOrDisable2FA'

const UserViewRight = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <ChangePassword />
      </Grid>
      <Grid item xs={12}>
        <EnableOrDisable2FA />
      </Grid>
    </Grid>
  )
}

export default UserViewRight
