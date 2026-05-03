// ** Type import
import { HorizontalNavItemsType } from 'src/@core/layouts/types'

const navigation = (): HorizontalNavItemsType => {
  return [
    {
      icon: 'tabler:smart-home',
      title: 'Dashboard',
      path: '/dashboards'
    },
    {
      icon: 'tabler:users',
      title: 'Users',
      path: '/apps/user/list'
    },
    {
      title: 'Medical Profiles',
      icon: 'tabler:stethoscope',
      path: '/apps/emergency/medical-profiles'
    },
    {
      title: 'Emergency Contacts',
      icon: 'tabler:phone-call',
      path: '/apps/emergency/emergency-contacts'
    },
    {
      title: 'Medical Summaries',
      icon: 'tabler:file-description',
      path: '/apps/emergency/medical-summaries'
    },
    {
      title: 'Reports',
      icon: 'tabler:report-analytics',
      path: '/apps/emergency/reports'
    },
    {
      title: 'QR Access',
      icon: 'tabler:qrcode',
      path: '/apps/emergency/qr-access'
    },
    {
      title: 'Panic Alerts',
      icon: 'tabler:alert-triangle',
      path: '/apps/emergency/panic-alerts'
    }
  ]
}

export default navigation
