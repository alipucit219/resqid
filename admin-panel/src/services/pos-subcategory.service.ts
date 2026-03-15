import apiClient from 'src/utils/api-client'

export const getAllPosSubcategories = async (categoryId?: number) => {
  const response = await apiClient.get('v2/pos/subcategory/list/all', {
    params: categoryId ? { categoryId } : undefined
  })

  return response.data
}

export const getPosSubcategoryById = async (id: number) => {
  const response = await apiClient.get(`v2/pos/subcategory/${id}`)

  return response.data
}
