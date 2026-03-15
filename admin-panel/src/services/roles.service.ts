import apiClient from "src/utils/api-client"

const getAllRolesStats = async () => {
  return await apiClient.get('v2/roles/stats/all');
}

const getAllRoles = async () => {
  return await apiClient.get('v2/roles/listAll')
}

const singleRoleDetail = async (id: number) => {
  const response = await apiClient.get(`v2/roles/${id}`)

  return response.data
}

export {
  singleRoleDetail,
  getAllRolesStats,
  getAllRoles
}