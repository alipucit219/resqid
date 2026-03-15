// src/layouts/components/acl/CanViewNavLink.tsx
import { ReactNode } from 'react'
import { NavLink } from 'src/@core/layouts/types'

interface Props {
  navLink?: NavLink
  children: ReactNode
}

const CanViewNavLink = (props: Props) => {
  const { children } = props

  return <>{children}</>
}

export default CanViewNavLink