import { StaffType } from './userTypes'

export interface AssetType {
  id: number
  title: string
  category: string
  subCategory: string
  status: string
  assignedTo: StaffType
  damagedBy: StaffType
  purchasingPrice?: number
  approval: string
  images: AssetImageType[]
  quantity: number
  expiryDate: string
  purchaseDate: string
  isNew: boolean
  warranty: number
  isAssignable: boolean
  description: string
  totalWorth?: number
  repairedCost: number
  quarantinedQuantity: number
  damagedQuantity: number
  stolenFrom?: StaffType | null
  soldPrice?: number
  assignedDate: string
}

export interface DataParams {
  limit?: number
  page?: number
  status: string
  subCategory?: string
}
interface AssetImageType {
  id: number
  isMain: boolean
  type: string
  url: string
}
export interface ActivityType {
  id: number
  description: string
  note: string
  status: string
  approvalStatus: string
  approvedBy: StaffType | null
  approvedDate: string
  repairedPrice: number
  assignedTo: StaffType | null
  stolenFrom: StaffType | null
  damagedBy: StaffType | null
  images: string[]
  purchasedQuantity: number
  purchasingPrice: number
  quarantinedQuantity: number
  quarantinedToInstallQuantity: number
  damagedQuantity: number
  rejectedBy: StaffType | null
}

export interface AttributeType {
  id: number
  heading: string
  description: string
}

export interface CategoryStatsType {
  totalAssets: number
  pendingApprovals: number
  assetsWorth: number
}

export enum AssetStatus {
  Modification = 'Modification',
  Remove = 'Remove',
  Deletable = 'Deletable',
  SoldOut = 'Sold Out',
  Assigned = 'Assigned',
  Purchased = 'Purchased',
  Repaired = 'Repaired',
  Stolen = 'Stolen',
  Damaged = 'Damaged',
  InDemand = 'In Demand',
  Purchasing = 'Purchasing',
  Available = 'Available',
  AddQuantity = 'Add Quantity',
  Quarantine = 'Quarantine',
  QuarantineToInstall = 'Quarantine To Install'
}
