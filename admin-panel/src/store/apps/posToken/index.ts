import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  fromDate?: string
  toDate?: string
  staffId?: number
  dishId?: number
  limit?: number
  page?: number
}

interface PosTokenState {
  data: any[]
  total: number
  latestToken: any | null
  isLoading: boolean
}

export const DEFAULT_POS_TOKEN_PARAMS: DataParams = {
  limit: 20,
  page: 0
}

export const fetchPosTokens = createAsyncThunk(
  'appPosToken/fetchData',
  async (params: DataParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/pos/token', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const addPosToken = createAsyncThunk(
  'appPosToken/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/pos/token', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const resetPreviousDayTokens = createAsyncThunk(
  'appPosToken/resetPreviousDay',
  async (olderThanHours: number = 24, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete('v2/pos/token/reset/previous-day', {
        params: { olderThanHours }
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const appPosTokenSlice = createSlice({
  name: 'appPosToken',
  initialState: {
    data: [],
    total: 0,
    latestToken: null as any,
    isLoading: false
  } as PosTokenState,
  reducers: {
    clearLatestToken: state => {
      state.latestToken = null
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchPosTokens.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPosTokens.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(fetchPosTokens.rejected, state => {
      state.isLoading = false
    })
    builder.addCase(addPosToken.fulfilled, (state, action) => {
      state.latestToken = action.payload.data
      state.data = [action.payload.data, ...state.data]
      state.total = Number(state.total || 0) + 1
    })
  }
})

export const { clearLatestToken } = appPosTokenSlice.actions
export default appPosTokenSlice.reducer
