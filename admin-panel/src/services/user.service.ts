import apiClient from "src/utils/api-client"

const singleUserDetail = async (id: number) => {
  const response = await apiClient.get(`v2/user/${id}`)

  return response.data
}

export {
  singleUserDetail
}