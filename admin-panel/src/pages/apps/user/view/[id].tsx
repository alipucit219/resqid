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
    <UserViewPage id={String(router?.query?.id)} />
      ,
      requiredPermission:"LIST_USERS"
    })
    )
  }

  return null
}

export default UserView
