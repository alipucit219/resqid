import apiClient from 'src/utils/api-client'

export const getAllPosSeats = async (roomId?: number) => {
  const response = await apiClient.get('v2/pos/seat/list/all', {
    params: roomId ? { roomId } : undefined
  })

  return response.data
}

export const getPosSeatById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/seat/${id}`)

  return response.data
}
