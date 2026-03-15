import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  tableNumber?: string
  limit?: number
  page?: number
  hallId?: number
  roomId?: number
}

export const DEFAULT_POS_TABLE_PARAMS: DataParams = {
  limit: 10,
  page: 0
}

export const fetchPosTables = createAsyncThunk(
  'appPosTable/fetchData',
  async (params: DataParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/pos/table', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const addPosTable = createAsyncThunk(
  'appPosTable/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/pos/table', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const updatePosTable = createAsyncThunk(
  'appPosTable/update',
  async (data: any, { rejectWithValue }) => {
    const { id, payload } = data
    try {
      const response = await apiClient.put(`v2/pos/table/${id}`, payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const deletePosTable = createAsyncThunk(
  'appPosTable/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`v2/pos/table/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const appPosTableSlice = createSlice({
  name: 'appPosTable',
  initialState: {
    data: [],
    total: 0,
    isLoading: false
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchPosTables.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPosTables.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(updatePosTable.fulfilled, (state: any, action) => {
      state.data = state.data.map((item: any) => {
        if (item.id === action.payload.data.id) {
          return action.payload.data
        }
        return item
      })
    })
  }
})

export default appPosTableSlice.reducer
