import apiClient from 'src/utils/api-client'

export const getPosProductById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/product/${id}`)

  return response.data
}

export const getAllPosProducts = async (filters?: { categoryId?: number; subcategoryId?: number }) => {
  const response = await apiClient.get('v2/pos/product', {
    params: {
      page: 0,
      limit: 500,
      ...(filters || {})
    }
  })

  return response.data?.data || []
}
