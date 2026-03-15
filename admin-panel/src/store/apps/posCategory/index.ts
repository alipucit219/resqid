import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

interface DataParams {
  name?: string
  limit?: number
  page?: number
  categoryId?: number
}

export const DEFAULT_POS_CATEGORY_PARAMS: DataParams = {
  limit: 10,
  page: 0
}

export const fetchPosCategories = createAsyncThunk(
  'appPosCategory/fetchData',
  async (params: DataParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/pos/category', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const addPosCategory = createAsyncThunk(
  'appPosCategory/add',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/pos/category', data)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const updatePosCategory = createAsyncThunk(
  'appPosCategory/update',
  async (data: any, { rejectWithValue }) => {
    const { id, payload } = data
    try {
      const response = await apiClient.put(`v2/pos/category/${id}`, payload)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const deletePosCategory = createAsyncThunk(
  'appPosCategory/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`v2/pos/category/${id}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error)
    }
  }
)

export const appPosCategorySlice = createSlice({
  name: 'appPosCategory',
  initialState: {
    data: [],
    total: 0,
    isLoading: false
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchPosCategories.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPosCategories.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data
      state.total = action.payload.total
    })
    builder.addCase(updatePosCategory.fulfilled, (state: any, action) => {
      state.data = state.data.map((item: any) => {
        if (item.id === action.payload.data.id) {
          return action.payload.data
        }
        return item
      })
    })
  }
})

export default appPosCategorySlice.reducer
