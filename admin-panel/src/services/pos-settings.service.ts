import apiClient from 'src/utils/api-client'

export const getPosSettings = async () => {
  const response = await apiClient.get('v2/pos/settings')
  return response.data
}

export const updatePosSettings = async (payload: {
  serviceChargeAmount?: number
  gstPercent?: number
  systemDiscountPercent?: number
}) => {
  const response = await apiClient.put('v2/pos/settings', payload)
  return response.data
}
