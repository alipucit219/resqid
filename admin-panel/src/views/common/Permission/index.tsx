// import { memo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

interface Props {
  title: string
  children: any
}
const PermissionDialogWrapper = ({ title, children }: Props) => {
  const permissionsAllow: any = useSelector((state: RootState) => state.auth)

  if (permissionsAllow?.permissionsAllow.includes(title)) {
    // Return the wrapped component if the permission is allowed
    return <>{children}</>
  } else {
    // Return null or any other placeholder if the permission is not allowed
    return null
  }
}

export default PermissionDialogWrapper
