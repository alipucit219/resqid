// ** Types
import { ThemeColor } from 'src/@core/layouts/types'
import { ClientType } from './clientTypes'

type UserAndStaffCommonType = {
  id: number
  email: string
  fullName: string
}

export interface StoredUserType extends Omit<UserAndStaffCommonType, 'imageUrl'> {
  isTwoFactorAuthenticationEnabled: boolean
  permissions: string[]
  role: string
  staffId: number
}

export interface StoredUserType extends Omit<UserAndStaffCommonType, 'imageUrl'> {
  isTwoFactorAuthenticationEnabled: boolean
  permissions: string[]
  role: string
  staffId: number
}

type RoleType = {
  id: number
  name: string
}

export type StaffType = UserAndStaffCommonType &
  ClosedAndLeadByClientType & {
    contactNumber: string
    department: string
    designation: string
    ratePerHour: number
    dailyHours: number
    joiningDate: string
    resignationDate: string | null
    address: string
    CNIC: string
    emergencyContactNumber: string
    contractStartDate: string
    contractEndDate: string
    gender: string
    status: string
  }

export type ClosedAndLeadByClientType = {
  closedByClients: ClientType[]
  leadByClients: ClientType[]
}
export type UsersType = UserAndStaffCommonType & {
  isActive: boolean
  role: string
}

export type ProjectListDataType = {
  id: number
  img: string
  hours: string
  totalTask: string
  projectType: string
  projectTitle: string
  progressValue: number
  progressColor: ThemeColor
}

export interface ChangePasswordType {
  currentPassword: string
  newPassword: string
}
