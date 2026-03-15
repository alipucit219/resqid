import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  name?: string
  limit?: number
  page?: number
  hallId?: number
}

export const DEFAULT_POS_ROOM_PARAMS: DataParams = {
  limit: 10,
  page: 0
}

export const fetchPosRooms = createAsyncThunk(
  'appPosRoom/fetchData',
  async (params: DataParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/pos/room', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const addPosRoom = createAsyncThunk(
  'appPosRoom/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/pos/room', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const updatePosRoom = createAsyncThunk(
  'appPosRoom/update',
  async (data: any, { rejectWithValue }) => {
    const { id, payload } = data
    try {
      const response = await apiClient.put(`v2/pos/room/${id}`, payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const deletePosRoom = createAsyncThunk(
  'appPosRoom/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`v2/pos/room/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const appPosRoomSlice = createSlice({
  name: 'appPosRoom',
  initialState: {
    data: [],
    total: 0,
    isLoading: false
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchPosRooms.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPosRooms.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(updatePosRoom.fulfilled, (state: any, action) => {
      state.data = state.data.map((item: any) => {
        if (item.id === action.payload.data.id) {
          return action.payload.data
        }
        return item
      })
    })
  }
})

export default appPosRoomSlice.reducer
