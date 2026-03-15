import apiClient from 'src/utils/api-client'

export const getAllPosHalls = async () => {
  const response = await apiClient.get('v2/pos/hall/list/all')

  return response.data
}

export const getPosHallById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/hall/${id}`)

  return response.data
}
