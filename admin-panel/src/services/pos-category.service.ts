import apiClient from 'src/utils/api-client'

export const getAllPosCategories = async () => {
  const response = await apiClient.get('v2/pos/category/list/all')

  return response.data
}

export const getPosCategoryById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/category/${id}`)

  return response.data
}
