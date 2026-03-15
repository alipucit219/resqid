import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

type QrAccessParams = {
  search?: string
  userId?: string
  page?: number
  limit?: number
}

export const DEFAULT_QR_ACCESS_PARAMS: QrAccessParams = {
  search: '',
  page: 0,
  limit: 10
}

export const fetchQrAccess = createAsyncThunk(
  'qrAccess/fetch',
  async (params: QrAccessParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/admin/qr-access', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const regenerateQrForUser = createAsyncThunk(
  'qrAccess/regenerate',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`v2/admin/qr-access/${userId}/regenerate`)
      return {
        ...response.data,
        userId
      }
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

const qrAccessSlice = createSlice({
  name: 'qrAccess',
  initialState: {
    data: [],
    total: 0,
    isLoading: false,
    generatedQr: null
  } as {
    data: any[]
    total: number
    isLoading: boolean
    generatedQr: any
  },
  reducers: {
    clearGeneratedQr: state => {
      state.generatedQr = null
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchQrAccess.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchQrAccess.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data || []
      state.total = action.payload.total || 0
    })
    builder.addCase(fetchQrAccess.rejected, state => {
      state.isLoading = false
    })
    builder.addCase(regenerateQrForUser.fulfilled, (state, action) => {
      state.generatedQr = action.payload
    })
  }
})

export const { clearGeneratedQr } = qrAccessSlice.actions
export default qrAccessSlice.reducer

