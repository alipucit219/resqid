// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { ChangePasswordType } from 'src/types/apps/userTypes'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  name?: string
  roleId?: number
  limit?: number
  page?: number
}

export const DEFAULT_USER_PARAMS: DataParams = {
  name: '',
  roleId: 0,
  limit: 10,
  page: 0
}

// ** Fetch Users
export const fetchUsers = createAsyncThunk('appUsers/fetchData', async (params: DataParams) => {
  if (params.roleId === 0) delete params.roleId
  if (params.name?.length === 0) delete params.name

  const response = await apiClient.get('v2/user', { params })

  return response.data
})

// ** Fetch Basic Stats
export const fetchBasicStats = createAsyncThunk('appUsers/fetchBasicStats', async () => {
  const response = await apiClient('v2/user/dashboard/stats')

  return response.data
})

// ** Add User
export const addUser = createAsyncThunk('appUsers/addUser', async (data: any, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('v2/user', data)

    return response.data
  } catch (e) {
    return rejectWithValue(e)
  }
})

// ** Update User
export const updateUser = createAsyncThunk('appUsers/updateUser', async (data: any, { rejectWithValue }) => {
  const { id, payload } = data
  try {
    const response = await apiClient.put(`v2/user/${id}`, payload)

    return response.data
  } catch (e) {
    return rejectWithValue(e)
  }
})

//** Delete User
export const deleteUser = createAsyncThunk('appUsers/deleteUser', async (id: number) => {
  const response = await apiClient.delete(`v2/user/${id}`)

  return response.data
})

// ** Change password
export const changePassword = createAsyncThunk(
  'appUsers/changePassword',
  async (data: ChangePasswordType, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/auth/change-password', data)
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const appUsersSlice = createSlice({
  name: 'appUsers',
  initialState: {
    data: [],
    total: 0,
    isLoading: false,
    basicStats: {
      activeUsersCount: 0,
      inActiveUsersCount: 0,
      staffCount: 0,
      loginSessionsCount: 0
    }
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchUsers.pending, state => {
      state.isLoading = true
    })

    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })

    builder.addCase(updateUser.fulfilled, (state: any, action) => {
      state.data = state.data.map((user: any) => {
        if (user.id === action.payload.data.id) {
          return {
            ...action.payload.data
          }
        } else {
          return user
        }
      })
    })

    builder.addCase(fetchBasicStats.fulfilled, (state: any, action) => {
      state.basicStats = action.payload
    })
  }
})

export default appUsersSlice.reducer
