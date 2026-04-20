// ** MUI Imports
import Grid from '@mui/material/Grid'
import FallbackSpinner from 'src/@core/components/spinner'

// ** React
import { useEffect, useState } from 'react'

// ** Service
import { singleUserDetail } from 'src/services/user.service'
import modifyError from 'src/utils/customError'

// ** Types
import { UsersType } from 'src/types/apps/userTypes'

// ** Custom Components
import UserViewLeft from 'src/views/apps/user/view/components/UserViewLeft'
import UserViewRight from 'src/views/apps/user/view/components/UserViewRight'

type Props = {
  id: number
}

const UserView = ({ id }: Props) => {
  // ** State
  const [loading, setLoading] = useState<boolean>(true)
  const [userDetail, setUserDetail] = useState<UsersType>()

  const GetData = async () => {
    try {
      const res = await singleUserDetail(id)
      setUserDetail(res)
      setLoading(false)
    } catch (error) {
      modifyError(error)
    }
  }

  // ** Hook
  useEffect(() => {
    GetData()
  }, [id])

  return loading ? (
    <Grid
      container
      spacing={0}
      direction='column'
      alignItems='center'
      justifyContent='center'
      style={{ minHeight: '100vh' }}
    >
      <Grid item xs={3}>
        <FallbackSpinner />
      </Grid>
    </Grid>
  ) : (
    <Grid container spacing={6}>
      <Grid item xs={12} md={5} lg={4}>
        <UserViewLeft data={userDetail as UsersType} />
      </Grid>
      <Grid item xs={12} md={7} lg={8}>
        <UserViewRight />
      </Grid>
    </Grid>
  )
}

export default UserView
