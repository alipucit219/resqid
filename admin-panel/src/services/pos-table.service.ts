import apiClient from 'src/utils/api-client'

type PosTableFilterType = {
  hallId?: number
  roomId?: number
}

export const getAllPosTables = async (filters?: PosTableFilterType) => {
  const response = await apiClient.get('v2/pos/table/list/all', {
    params: filters
  })

  return response.data
}

export const getPosTableById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/table/${id}`)

  return response.data
}
