import apiClient from "src/utils/api-client"

const getAllPermissions = async () => {
  return await apiClient.get('v2/permissions/listAll');
}

export {
  getAllPermissions
}