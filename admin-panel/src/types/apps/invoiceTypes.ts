import { ClientType } from './clientTypes'
import { ProjectType } from './projectTypes'

export type InvoiceStatus = 'Paid' | string

export type InvoiceLayoutProps = {
  id: string | undefined
}

export type InvoiceClientType = {
  id: number
  name: string
  email: string
  phone: string
  country: string
}

export type InvoiceType = {
  id: number
  issueDate: string
  title: string
  project: Pick<ProjectType, 'id' | 'logoUrl' | 'name'>
  client: Pick<ClientType, 'id' | 'name' | 'country'>
  totalAmount: number
  amountReceived: number
  balance: number
  currency: string
  type: string
}

export type InvoicePaymentType = {
  id: number
  paymentDate: string
  paymentSource: string
  amount: number
  fee: number
  USDToPKR: number
}

export type SingleInvoiceType = {
  id: number
  issueDate: string
  dueDate: string
  title: string
  currency: string
  discount: number
  tax: number
  note: string
  type: string
  totalAmount: number
  amountReceived: number
  balance: number
  paymentDetail: { id: number; paymentMethod: string; paymentDetail: string; name: string }
  payments: InvoicePaymentType[]
  project: {
    id: number
    name: string
    logoUrl: string
    startDate: string
  }
  client: {
    id: number
    name: string
    country: string
    phone: number
    email: string
    commission: number
  }
  invoiceItems: {
    id: number
    name: string
    cost: number
    rate: number
    totalPrice: number
  }[]
}
export interface InvoicePaymentStatsType
  extends Pick<SingleInvoiceType, 'totalAmount' | 'amountReceived' | 'currency' | 'balance'> {}

export enum InvoiceTypeEnum {
  Project = 'Project',
  Other = 'Other'
}
