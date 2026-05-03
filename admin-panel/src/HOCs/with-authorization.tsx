import React, { ReactElement } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

type WithAuthorizationProps = {
  component: ReactElement
  requiredPermission: string
}

export function WithAuthorization({ component, requiredPermission }: WithAuthorizationProps): ReactElement {
  const { permissionsAllow: userAllowedPermissions, user } = useSelector((state: RootState) => state.auth)

  const role = String(user?.role || '').toLowerCase()
  const permissions = Array.isArray(userAllowedPermissions) ? userAllowedPermissions : []

  if (role === 'admin' || permissions.length === 0) {
    return component
  }

  if (permissions.includes(requiredPermission)) {
    return component
  }

  return <></>
}
