// ** Components Imports
import UserViewPage from 'src/views/apps/user/view/index'

// ** Next
import { useRouter } from 'next/router'
import { WithAuthorization } from 'src/HOCs/with-authorization'

const UserView = () => {
  const router = useRouter()
  if (router.query.id) {
    return (
    WithAuthorization({
      component:
    <UserViewPage id={router?.query?.id as unknown as number} />
      ,
      requiredPermission:"LIST_USERS"
    })
    )
  }
  
}

export default UserView
