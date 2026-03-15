import { StaffType } from './userTypes'

export interface DataParams {
  limit: number
  page: number
  status?: string
}
export enum KPIStatus {
  Pending_Approved = 'Pending Approval',
  Rated = 'Rated',
  Challenged = 'Challenged',
  Reverted = 'Reverted'
}
export interface KpiCategoryType {
  id: number
  label: string
}
export interface KpiType {
  id: number
  ratedTo: StaffType
  ratedBy: StaffType
  score: number
  review: string
  status: string
  hasPendingLog: boolean
  category: { id: number; label: string }
  createdAt: string
}
export interface KpiDetailType extends StaffType {
  overAllScore: number
  KpiStatus: string
  scorePercentage: number
}

export interface KpiLogDetailType {
  id: number
  initialComment: string
  finalComment: string
  score: number
  status: string
  approvalStatus: string
  finalStatus: string
  processedBy: StaffType
  requestedBy: StaffType
}
