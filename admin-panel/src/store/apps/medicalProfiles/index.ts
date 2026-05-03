import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

type MedicalProfileParams = {
  search?: string
  bloodGroup?: string
  allergy?: string
  page?: number
  limit?: number
}

export const DEFAULT_MEDICAL_PROFILE_PARAMS: MedicalProfileParams = {
  search: '',
  page: 0,
  limit: 10
}

export const fetchMedicalProfiles = createAsyncThunk(
  'medicalProfiles/fetch',
  async (params: MedicalProfileParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/admin/medical-profiles', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const updateMedicalProfile = createAsyncThunk(
  'medicalProfiles/update',
  async (data: { userId: string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`v2/admin/medical-profiles/${data.userId}`, data.payload)
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

const medicalProfilesSlice = createSlice({
  name: 'medicalProfiles',
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
    builder.addCase(fetchMedicalProfiles.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchMedicalProfiles.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data || []
      state.total = action.payload.total || 0
    })
    builder.addCase(fetchMedicalProfiles.rejected, state => {
      state.isLoading = false
    })
  }
})

export default medicalProfilesSlice.reducer
