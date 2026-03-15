// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { StaffType } from 'src/types/apps/userTypes'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  name?: string
  limit?: number
  page?: number
}

export const DEFAULT_STAFF_PARAMS: DataParams = {
  name: '',
  limit: 10,
  page: 0
}

// ** Fetch Staff
export const fetchStaff = createAsyncThunk('appStaff/fetchData', async (params: DataParams) => {
  const response = await apiClient.get('v2/staff', { params })

  return response.data
})

// ** Add Staff
export const addStaff = createAsyncThunk('appStaff/addStaff', async (data: any, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('v2/staff', data)

    return response.data
  } catch (e) {
    return rejectWithValue(e)
  }
})

// ** Update Staff
export const updateStaff = createAsyncThunk('appStaff/updateStaff', async (data: any, { rejectWithValue }) => {
  const { id, payload } = data
  try {
    const response = await apiClient.put(`v2/staff/${id}`, payload)

    return response.data
  } catch (e) {
    return rejectWithValue(e)
  }
})

//** Delete Staff
export const deleteStaff = createAsyncThunk('appStaff/deleteStaff', async (id: number) => {
  const response = await apiClient.delete(`v2/staff/${id}`)

  return response.data
})

// ** Fetch Single Staff Detail
export const fetchSingleStaffDetail = createAsyncThunk(
  'appStaff/fetchSingleStaffDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`v2/staff/${id}`)
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const appStaffSlice = createSlice({
  name: 'appStaff',
  initialState: {
    data: [],
    total: 0,
    isLoading: false,
    SingleStaffDetail: {} as StaffType
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchStaff.pending, state => {
      state.isLoading = true
    })

    builder.addCase(fetchStaff.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })

    builder.addCase(fetchSingleStaffDetail.fulfilled, (state, action) => {
      state.SingleStaffDetail = action.payload
    })

    builder.addCase(updateStaff.fulfilled, (state: any, action) => {
      state.data = state.data.map((staff: any) => {
        if (staff.id === action.payload.data.id) {
          return {
            ...action.payload.data
          }
        } else {
          return staff
        }
      })
    })
  }
})

export default appStaffSlice.reducer
