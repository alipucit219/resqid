import apiClient from 'src/utils/api-client'

export const getAllPosRooms = async (hallId?: number) => {
  const response = await apiClient.get('v2/pos/room/list/all', {
    params: hallId ? { hallId } : undefined
  })

  return response.data
}

export const getPosRoomById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/room/${id}`)

  return response.data
}
