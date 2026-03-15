// src/layouts/components/acl/CanViewNavSectionTitle.tsx
import { ReactNode } from 'react'
import { NavSectionTitle } from 'src/@core/layouts/types'

interface Props {
  children: ReactNode
  navTitle?: NavSectionTitle
}

const CanViewNavSectionTitle = (props: Props) => {
  const { children } = props

  return <>{children}</>
}

export default CanViewNavSectionTitle