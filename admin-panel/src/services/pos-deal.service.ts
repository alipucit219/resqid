import apiClient from 'src/utils/api-client'

export const getPosDealById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/deal/${id}`)

  return response.data
}

export const getAllPosDeals = async () => {
  const response = await apiClient.get('v2/pos/deal/list/all', {
    params: {}
  })

  return response.data || []
}
