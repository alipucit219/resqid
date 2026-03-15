import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  seatNumber?: string
  limit?: number
  page?: number
  roomId?: number
}

export const DEFAULT_POS_SEAT_PARAMS: DataParams = {
  limit: 10,
  page: 0
}

export const fetchPosSeats = createAsyncThunk(
  'appPosSeat/fetchData',
  async (params: DataParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/pos/seat', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const addPosSeat = createAsyncThunk(
  'appPosSeat/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/pos/seat', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const updatePosSeat = createAsyncThunk(
  'appPosSeat/update',
  async (data: any, { rejectWithValue }) => {
    const { id, payload } = data
    try {
      const response = await apiClient.put(`v2/pos/seat/${id}`, payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const deletePosSeat = createAsyncThunk(
  'appPosSeat/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`v2/pos/seat/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const appPosSeatSlice = createSlice({
  name: 'appPosSeat',
  initialState: {
    data: [],
    total: 0,
    isLoading: false
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchPosSeats.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPosSeats.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(updatePosSeat.fulfilled, (state: any, action) => {
      state.data = state.data.map((item: any) => {
        if (item.id === action.payload.data.id) {
          return action.payload.data
        }
        return item
      })
    })
  }
})

export default appPosSeatSlice.reducer
