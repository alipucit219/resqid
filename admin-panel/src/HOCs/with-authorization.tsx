import React, { ReactElement } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

type WithAuthorizationProps = {
  component: ReactElement
  requiredPermission: string
}

export function WithAuthorization({ component, requiredPermission }: WithAuthorizationProps): ReactElement {
  const { permissionsAllow: userAllowedPermissions } = useSelector((state: RootState) => state.auth)

  if ((userAllowedPermissions as string[]).includes(requiredPermission)) {
    return component
  }

  return <></> // Or consider returning something like <div>Access Denied</div>
}
