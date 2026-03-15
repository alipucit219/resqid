import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

export const fetchPosDeals = createAsyncThunk(
  'appPosDeal/fetchData',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/pos/deal/list/all')
      return response.data || []
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const addPosDeal = createAsyncThunk(
  'appPosDeal/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/pos/deal', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const updatePosDeal = createAsyncThunk(
  'appPosDeal/update',
  async (data: any, { rejectWithValue }) => {
    const { id, payload } = data
    try {
      const response = await apiClient.put(`v2/pos/deal/${id}`, payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const deletePosDeal = createAsyncThunk(
  'appPosDeal/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`v2/pos/deal/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const appPosDealSlice = createSlice({
  name: 'appPosDeal',
  initialState: {
    data: [],
    isLoading: false
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchPosDeals.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPosDeals.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload
    })
    builder.addCase(fetchPosDeals.rejected, state => {
      state.isLoading = false
    })
    builder.addCase(updatePosDeal.fulfilled, (state: any, action) => {
      state.data = state.data.map((item: any) => {
        if (item.id === action.payload.data.id) {
          return action.payload.data
        }
        return item
      })
    })
  }
})

export default appPosDealSlice.reducer
