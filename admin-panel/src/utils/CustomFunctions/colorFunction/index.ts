import { KPIStatus } from 'src/types/apps/kpiTypes'
import { ProjectStatus } from 'src/types/apps/projectTypes'

export const getAssetStatusColor = (status: string) => {
  switch (status) {
    case 'Repaired':
      return 'warning'
    case 'Modification':
      return 'success'
    case 'Purchasing':
      return 'info'
    case 'Available':
      return 'primary'
    case 'Deletable':
      return 'secondary'
    case 'Purchased':
      return 'success'
    default:
      return 'error'
  }
}
export const getKpiStatusColor = (status: string) => {
  switch (status) {
    case KPIStatus.Rated:
      return 'success'
    case KPIStatus.Challenged:
      return 'error'
    case KPIStatus.Pending_Approved:
      return 'info'
    default:
      return 'secondary'
  }
}

export const getColorByProjectStatus = (status: string) => {
  switch (status) {
    case ProjectStatus.Active:
      return 'info'
    case ProjectStatus.Completed:
      return 'success'
    case ProjectStatus.Cancelled:
      return 'secondary'
    case ProjectStatus.Paused:
      return 'warning'
    default:
      return 'error'
  }
}
export const convertToUSNumber = (n: number) => {
  const formatted = (+n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })

  return formatted
}
export const CheckPermission = (permissionsAllow: any, title: string) => {
  const check = permissionsAllow?.permissionsAllow.includes(title)
  return !check
}
