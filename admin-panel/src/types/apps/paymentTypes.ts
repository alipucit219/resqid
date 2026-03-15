// ** Types
import { ClientType } from './clientTypes'
import { SingleInvoiceType } from './invoiceTypes'
import { ProjectType } from './projectTypes'

export interface DataParams {
  limit: number
  page: number
  startDate?: Date | null
  endDate?: Date | null
}

export interface PaymentStatsType {
  totalAmountPKR: number
  totalAmountUSD: number
  totalRevenueUSD: number
}
export interface PaymentType {
  id: number
  amount: number
  USDToPKR: number
  fee: number
  externelFee: number
  paymentDate: string
  revenue: number
  paymentSource: string
  transactionId: string
  paymentDestination: string
  note: string
  project: Pick<ProjectType, 'id' | 'logoUrl' | 'name'>
  client: Pick<ClientType, 'id' | 'name'>
  invoice: Pick<SingleInvoiceType, 'id' | 'title' | 'type'>
}
export enum PaymentsSource {
  // Upwork = 'Upwork',
  // Fiverr = 'Fiverr',
  // Freelancer = 'Freelancer'
  Bank = 'Bank',
  Payoneer = 'Payoneer',
  Paypal = 'Paypal',
  Skrill = 'Skrill',
  Crypto = 'Crypto',
  CashDollar = 'Cash Dollar',
  CashPKR = 'Cash PKR'
}

export enum PaymentDestination {
  Bank = 'Bank',
  Payoneer = 'Payoneer',
  Paypal = 'Paypal',
  Skrill = 'Skrill',
  Crypto = 'Crypto',
  CashDollar = 'Cash Dollar',
  CashPKR = 'Cash PKR',
  Other = 'Other'
}
