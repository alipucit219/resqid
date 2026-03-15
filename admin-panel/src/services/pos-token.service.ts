import apiClient from 'src/utils/api-client'

export const getPosTokenStaffList = async () => {
  const response = await apiClient.get('v2/pos/token/staff/list/all')

  return response.data
}

export const getPosTokenById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/token/${id}`)

  return response.data
}

export const getPosDayEndTokenReport = async (date?: string) => {
  const response = await apiClient.get('v2/pos/token/report/day-end', {
    params: date ? { date } : undefined
  })

  return response.data
}
