import { ProjectDetailType, ProjectInvoiceType, ProjectPaymentType } from './projectTypes'
import { StaffType } from './userTypes'

export interface ClosedByType extends StaffType {}
export interface LeadByType extends StaffType {}

export interface ClientCommentDataParams {
  id: number
  limit: number
  page: number
}
export interface ClientType {
  id: number
  name: string
  email: string
  phone: string
  country: string
  closedBy: ClosedByType
  leadBy: LeadByType | null
}

export type ClientDetailType = ClientType &
  ClientStatsType & {
    commission: number
  }

export interface ClientStatsType {
  totalReceivedAmount: number
  totalAmount: number
}

export interface ClientProjectType extends ProjectDetailType {}

export interface ClientInvoiceType extends ProjectInvoiceType {
  project: ProjectDetailType
}
export interface ClientPaymentType extends ProjectPaymentType {}

export interface RecentClientUpdatesType {
  id: number
  addedBy: Pick<StaffType, 'fullName'>
  allowed: StaffType[]
  comment: string
  createdAt: string
}
