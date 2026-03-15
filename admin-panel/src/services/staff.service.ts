import apiClient from 'src/utils/api-client'

type StaffFindByCriteriaType = {
  email: string
  CNIC: string
  accountNo: string
}

const getAllStaff = async () => {
  return await apiClient.get('v2/staff/list/all')
}
const getAllBD = async () => {
  return await apiClient.get('v2/staff/list/by-department?department=Management')
}

const singleStaffDetail = async (id: number) => {
  const response = await apiClient.get(`v2/staff/${id}`)

  return response.data
}

const findByCriteria = async (criteria: Partial<StaffFindByCriteriaType>) => {
  const response = await apiClient.post('v2/staff/find-by-criteria', criteria)
  return response.data
}

export { getAllStaff, singleStaffDetail, findByCriteria, getAllBD }
