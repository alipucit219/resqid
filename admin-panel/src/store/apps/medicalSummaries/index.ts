import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

type MedicalSummaryParams = {
  search?: string
  userId?: string
  page?: number
  limit?: number
}

export const DEFAULT_MEDICAL_SUMMARY_PARAMS: MedicalSummaryParams = {
  search: '',
  page: 0,
  limit: 10
}

export const fetchMedicalSummaries = createAsyncThunk(
  'medicalSummaries/fetch',
  async (params: MedicalSummaryParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/admin/medical-summaries', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const updateMedicalSummary = createAsyncThunk(
  'medicalSummaries/update',
  async (data: { userId: string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`v2/admin/medical-summaries/${data.userId}`, data.payload)
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

const medicalSummariesSlice = createSlice({
  name: 'medicalSummaries',
  initialState: {
    data: [],
    total: 0,
    isLoading: false
  } as {
    data: any[]
    total: number
    isLoading: boolean
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchMedicalSummaries.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchMedicalSummaries.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data || []
      state.total = action.payload.total || 0
    })
    builder.addCase(fetchMedicalSummaries.rejected, state => {
      state.isLoading = false
    })
  }
})

export default medicalSummariesSlice.reducer

