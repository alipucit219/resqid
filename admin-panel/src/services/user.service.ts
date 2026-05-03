import apiClient from 'src/utils/api-client'

const singleUserDetail = async (id: string) => {
  const response = await apiClient.get(`v2/user/${id}`)

  return response.data?.data || response.data
}

export {
  singleUserDetail
}
