// src/layouts/components/acl/CanViewNavGroup.tsx
import { ReactNode } from 'react'
import { NavGroup } from 'src/@core/layouts/types'

interface Props {
  navGroup?: NavGroup
  children: ReactNode
}

const CanViewNavGroup = (props: Props) => {
  const { children } = props

  return <>{children}</>
}

export default CanViewNavGroup