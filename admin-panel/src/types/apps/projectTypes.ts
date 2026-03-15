// ** Types
import { ClientType, RecentClientUpdatesType } from './clientTypes'
import { StaffType } from './userTypes'

export interface DataParams {
  status?: string
  name?: string
  limit?: number
  page?: number
}
export interface ProjectCommentDataParams {
  id: number
  limit: number
  page: number
}
export interface AllowProjectAttributePermissionDataParams {
  id: number
  payload: number[]
}
export interface ProjectType {
  id: number
  name: string
  logoUrl: string
  recentComment: string
  client: ClientType
  amountExpected: number
  paymentReceived: number
  totalCost: number
  status: string
  startDate: string
}

export interface TeamType
  extends Pick<StaffType, 'id' | 'designation' | 'email' | 'imageUrl' | 'joiningDate' | 'fullName'> {}
export interface ProjectDetailType {
  id: number
  name: string
  logoUrl: string
  startDate: string
  platform: string
  status: string
  client: Pick<ClientType, 'email' | 'name' | 'country' | 'phone'>
  totalCost: number
  totalReceivedAmount: number
  balance: number
  expectedAmount: number
  totalTeamCost: number
  detail: string
  team: TeamType[]
}
export interface ProjectStatsType
  extends Pick<
    ProjectDetailType,
    'totalCost' | 'balance' | 'totalReceivedAmount' | 'totalTeamCost' | 'expectedAmount'
  > {}

export interface ProjectInvoiceType {
  id: number
  title: string
  issueDate: string
  dueDate: string
  totalCost: number
  paymentReceived: number
}

export interface ProjectPaymentType {
  id: number
  amount: number
  paymentDate: string
  paymentSource: string
  note: string
  invoice: {
    id: number
  }
}

export interface ProjectTeamType extends StaffType {}

export interface ProjectCommissionType {
  id: number
  staff: Pick<StaffType, 'fullName' | 'email' | 'imageUrl' | 'designation'>
  type: { type: string }
  commission: number
}

export interface BDProjectCommissionType extends Omit<ProjectCommissionType, 'staff'> {
  project: Pick<ProjectDetailType, 'id' | 'name' | 'logoUrl'>
  amount: number
}

export interface CommissionHistoryType {
  id: number
  startDate: string
  endDate: string
  amount: number
}
export interface ProjectAttributeType {
  id: number
  title: string
  attributes: { key: string; value: string }[]
  createdAt: string
  notes: string
  project: ProjectType
  allowed: StaffType[]
}
export enum ProjectPlatform {
  Upwork = 'Upwork',
  Fiverr = 'Fiverr',
  LinkedIn = 'LinkedIn',
  Freelancer = 'Freelancer',
  EmailWebsite = 'Email/Website',
  Referral = 'Referral',
  Angellist = 'Angellist'
}
export enum ProjectStatus {
  Active = 'Active',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
  Paused = 'Paused',
  InDiscussion = 'In-Discussion',
  PendingOnboard = 'Pending Onboard',
  Disputed = 'Disputed',
  Refunded = 'Refunded',
  CriticalState = 'Critical State'
}

export enum BdCommissionEnum {
  projectCommission = 'Project Commission',
  commissionHistory = 'Commission History'
}

export interface RecentProjectUpdatesType extends RecentClientUpdatesType {}
