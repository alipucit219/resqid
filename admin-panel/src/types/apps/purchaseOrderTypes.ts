export type ExpenseType = {
  id: number
  description: string
  poCost: number
  qty: number
  poTotalAmount: number
  expenseHead: { id: number }
}
export type CommentType = {
  id: number
  comment: string
  createdAt: string
  addedBy: { id: number; fullName: string; imageUrl: string }
}
export type PettyCashType = {
  creditAmount: number
  debitAmount: number
}
export interface PurchaseOrderDetailType {
  id: number
  title: string
  amountGiven: number
  amountGivenDate: string
  additionalAmountGiven: number
  poStatus: string
  invoiceUrl: string
  note: string
  expenses: ExpenseType[]
  comments: CommentType[]
  pettyCash: PettyCashType[]
}
export interface DataParams {
  startDate?: Date | null
  endDate?: Date | null
  limit?: number
  page?: number
  status: string
}
