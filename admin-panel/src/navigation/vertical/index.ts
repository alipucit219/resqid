// ** Type import
// import { useEffect, useState } from 'react'
// import { useSelector } from 'react-redux'
import { VerticalNavItemsType } from 'src/@core/layouts/types'
// import { RootState } from 'src/store'
// import user from 'src/store/apps/user'
// import { verticalSidebarData } from './verticalSidebarData'

const navigation = (props: any): VerticalNavItemsType => {
  const { modifyVerticalnavItems } = props

  return modifyVerticalnavItems
}

export default navigation
