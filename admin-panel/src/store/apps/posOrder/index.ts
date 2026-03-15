import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  customerName?: string
  staffId?: number
  isFinalized?: boolean
  limit?: number
  page?: number
}

interface PosOrderState {
  data: any[]
  total: number
  latestOrder: any | null
  isLoading: boolean
}

export const DEFAULT_POS_ORDER_PARAMS: DataParams = {
  limit: 20,
  page: 0
}

export const fetchPosOrders = createAsyncThunk(
  'appPosOrder/fetchData',
  async (params: DataParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/pos/order', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const addPosOrder = createAsyncThunk(
  'appPosOrder/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/pos/order', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const updatePosOrder = createAsyncThunk(
  'appPosOrder/update',
  async (data: any, { rejectWithValue }) => {
    const { id, payload } = data
    try {
      const response = await apiClient.put(`v2/pos/order/${id}`, payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const finalizePosOrder = createAsyncThunk(
  'appPosOrder/finalize',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`v2/pos/order/${id}/finalize`)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const appPosOrderSlice = createSlice({
  name: 'appPosOrder',
  initialState: {
    data: [],
    total: 0,
    latestOrder: null,
    isLoading: false
  } as PosOrderState,
  reducers: {
    clearLatestOrder: state => {
      state.latestOrder = null
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchPosOrders.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPosOrders.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(fetchPosOrders.rejected, state => {
      state.isLoading = false
    })
    builder.addCase(addPosOrder.fulfilled, (state, action) => {
      state.latestOrder = action.payload.data
      state.data = [action.payload.data, ...state.data]
      state.total = Number(state.total || 0) + 1
    })
    builder.addCase(updatePosOrder.fulfilled, (state, action) => {
      state.latestOrder = action.payload.data
      state.data = state.data.map(order => (order.id === action.payload.data.id ? action.payload.data : order))
    })
    builder.addCase(finalizePosOrder.fulfilled, (state, action) => {
      state.latestOrder = action.payload.data
      state.data = state.data.map(order => (order.id === action.payload.data.id ? action.payload.data : order))
    })
  }
})

export const { clearLatestOrder } = appPosOrderSlice.actions
export default appPosOrderSlice.reducer
