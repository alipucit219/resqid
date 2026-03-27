// ** React Imports
import { ReactNode, useEffect, useState } from 'react'

// ** MUI Imports
import { Theme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Layout Imports
// !Do not remove this Layout import
import Layout from 'src/@core/layouts/Layout'

// ** Navigation Imports
// import VerticalNavItems from 'src/navigation/vertical'
import HorizontalNavItems from 'src/navigation/horizontal'

// ** Component Import
// Uncomment the below line (according to the layout type) when using server-side menu
// import ServerSideVerticalNavItems from './components/vertical/ServerSideNavItems'
// import ServerSideHorizontalNavItems from './components/horizontal/ServerSideNavItems'

import VerticalAppBarContent from './components/vertical/AppBarContent'
import HorizontalAppBarContent from './components/horizontal/AppBarContent'

// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings'
import { AppDispatch, RootState } from 'src/store'
import { useSelector } from 'react-redux'
import { verticalSidebarData } from 'src/navigation/vertical/verticalSidebarData'
import { setPermissionforApproval } from 'src/store/apps/auth'
import { useDispatch } from 'react-redux'

interface Props {
  children: ReactNode
  contentHeightFixed?: boolean
}

const UserLayout = ({ children, contentHeightFixed }: Props) => {
  // ** Hooks
  const { settings, saveSettings } = useSettings()
  const user: any = useSelector((state: RootState) => state.auth)
  const dispatch: AppDispatch = useDispatch()
  const [modifyVerticalnavItems, setModifyverticalNavitems] = useState<any>([])
  const [modifyHorizontalNavItems, setModifyHorizontalNavItems] = useState<any>([])

  const filterNavItemsByPermissions = (navItems: any[], userPermissionKeys: string[]): any[] => {
    const alwaysVisibleItems = new Set(['Dashboard', 'Users', 'Spaces', 'User', 'Staff'])

    return navItems.reduce((filteredItems: any[], item: any) => {
      if (item?.children?.length) {
        const filteredChildren = filterNavItemsByPermissions(item.children, userPermissionKeys)

        if (filteredChildren.length) {
          filteredItems.push({ ...item, children: filteredChildren })
        }

        return filteredItems
      }

      if (alwaysVisibleItems.has(item?.title) || userPermissionKeys.includes(item?.title)) {
        filteredItems.push(item)
      }

      return filteredItems
    }, [])
  }

  const filterOptions = () => {
    const userPermissionKeys = Object.keys(user?.user?.permissions || {})
    const userRole = (user?.user?.role || '').toString().toLowerCase()
    const shouldBypassPermissionFiltering = userRole === 'admin' || userPermissionKeys.length === 0

    if (shouldBypassPermissionFiltering) {
      setModifyverticalNavitems(verticalSidebarData)
      setModifyHorizontalNavItems(HorizontalNavItems())

      return
    }

    setModifyverticalNavitems(filterNavItemsByPermissions(verticalSidebarData, userPermissionKeys))
    setModifyHorizontalNavItems(filterNavItemsByPermissions(HorizontalNavItems(), userPermissionKeys))
  }

  const modilfyPermission = async () => {
    if (!user?.user?.permissions) return // Exit early if permissions are not available

    const permissionsObject: { [key: string]: string[] } = user?.user?.permissions || {}
    const combinedPermissions: any[] = ([] as any[])?.concat(...(Object?.values(permissionsObject) ?? [])) ?? []

    dispatch(setPermissionforApproval(combinedPermissions))
  }

  useEffect(() => {
    filterOptions()
    if (user?.user?.permissions) modilfyPermission()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user?.permissions])
  // ** Vars for server side navigation
  // const { menuItems: verticalMenuItems } = ServerSideVerticalNavItems()
  // const { menuItems: horizontalMenuItems } = ServerSideHorizontalNavItems()

  /**
   *  The below variable will hide the current layout menu at given screen size.
   *  The menu will be accessible from the Hamburger icon only (Vertical Overlay Menu).
   *  You can change the screen size from which you want to hide the current layout menu.
   *  Please refer useMediaQuery() hook: https://mui.com/material-ui/react-use-media-query/,
   *  to know more about what values can be passed to this hook.
   *  ! Do not change this value unless you know what you are doing. It can break the template.
   */
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))

  if (hidden && settings.layout === 'horizontal') {
    settings.layout = 'vertical'
  }

  return (
    <Layout
      hidden={hidden}
      settings={settings}
      saveSettings={saveSettings}
      contentHeightFixed={contentHeightFixed}
      verticalLayoutProps={{
        navMenu: {
          navItems: modifyVerticalnavItems
          // navItems: VerticalNavItems()

          // Uncomment the below line when using server-side menu in vertical layout and comment the above line
          // navItems: verticalMenuItems
        },
        appBar: {
          content: props => (
            <VerticalAppBarContent
              hidden={hidden}
              settings={settings}
              saveSettings={saveSettings}
              toggleNavVisibility={props.toggleNavVisibility}
            />
          )
        }
      }}
      {...(settings.layout === 'horizontal' && {
        horizontalLayoutProps: {
          navMenu: {
            navItems: modifyHorizontalNavItems

            // Uncomment the below line when using server-side menu in horizontal layout and comment the above line
            // navItems: horizontalMenuItems
          },
          appBar: {
            content: () => <HorizontalAppBarContent hidden={hidden} settings={settings} saveSettings={saveSettings} />
          }
        }
      })}
    >
      {children}
    </Layout>
  )
}

export default UserLayout

