import apiClient from 'src/utils/api-client'

type PosTokenListParams = {
  limit?: number
}

export const getPosOrderById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/order/${id}`)

  return response.data
}

export const getPosOrderStaffList = async () => {
  const response = await apiClient.get('v2/pos/order/staff/list/all')

  return response.data
}

export const getPosDayEndOrderReport = async (date?: string) => {
  const response = await apiClient.get('v2/pos/order/report/day-end', {
    params: date ? { date } : undefined
  })

  return response.data
}

export const getPosOrderDashboardStats = async () => {
  const response = await apiClient.get('v2/pos/order/report/dashboard-stats')

  return response.data
}

export const getPosTokensForOrder = async (params?: PosTokenListParams) => {
  const response = await apiClient.get('v2/pos/order/token/list/available', {
    params: {
      limit: 200,
      ...(params || {})
    }
  })

  return {
    data: response.data || []
  }
}
