import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  name?: string
  limit?: number
  page?: number
  categoryId?: number
  subcategoryId?: number
}

export const DEFAULT_POS_PRODUCT_PARAMS: DataParams = {
  limit: 10,
  page: 0
}

export const fetchPosProducts = createAsyncThunk(
  'appPosProduct/fetchData',
  async (params: DataParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/pos/product', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const addPosProduct = createAsyncThunk(
  'appPosProduct/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/pos/product', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const updatePosProduct = createAsyncThunk(
  'appPosProduct/update',
  async (data: any, { rejectWithValue }) => {
    const { id, payload } = data
    try {
      const response = await apiClient.put(`v2/pos/product/${id}`, payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const deletePosProduct = createAsyncThunk(
  'appPosProduct/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`v2/pos/product/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const appPosProductSlice = createSlice({
  name: 'appPosProduct',
  initialState: {
    data: [],
    total: 0,
    isLoading: false
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchPosProducts.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPosProducts.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(updatePosProduct.fulfilled, (state: any, action) => {
      state.data = state.data.map((item: any) => {
        if (item.id === action.payload.data.id) {
          return action.payload.data
        }
        return item
      })
    })
  }
})

export default appPosProductSlice.reducer
