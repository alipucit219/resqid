import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

type PanicAlertParams = {
  search?: string
  userId?: string
  status?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}

export const DEFAULT_PANIC_ALERT_PARAMS: PanicAlertParams = {
  search: '',
  status: '',
  fromDate: '',
  toDate: '',
  page: 0,
  limit: 10
}

export const fetchPanicAlerts = createAsyncThunk(
  'panicAlerts/fetch',
  async (params: PanicAlertParams, { rejectWithValue }) => {
    try {
      const finalParams = { ...params }
      if (!finalParams.status) delete finalParams.status
      if (!finalParams.search) delete finalParams.search
      if (!finalParams.fromDate) delete finalParams.fromDate
      if (!finalParams.toDate) delete finalParams.toDate
      const response = await apiClient.get('v2/admin/panic-alerts', { params: finalParams })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const fetchPanicAlertDetail = createAsyncThunk(
  'panicAlerts/fetchDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`v2/admin/panic-alerts/${id}`)
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

const panicAlertsSlice = createSlice({
  name: 'panicAlerts',
  initialState: {
    data: [],
    total: 0,
    isLoading: false,
    activeDetail: null
  } as {
    data: any[]
    total: number
    isLoading: boolean
    activeDetail: any
  },
  reducers: {
    clearPanicAlertDetail: state => {
      state.activeDetail = null
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchPanicAlerts.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchPanicAlerts.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data || []
      state.total = action.payload.total || 0
    })
    builder.addCase(fetchPanicAlerts.rejected, state => {
      state.isLoading = false
    })
    builder.addCase(fetchPanicAlertDetail.fulfilled, (state, action) => {
      state.activeDetail = action.payload
    })
  }
})

export const { clearPanicAlertDetail } = panicAlertsSlice.actions
export default panicAlertsSlice.reducer
