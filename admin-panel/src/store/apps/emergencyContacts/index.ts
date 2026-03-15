import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import apiClient from 'src/utils/api-client'
import modifyError from 'src/utils/customError'

type EmergencyContactParams = {
  search?: string
  userId?: string
  page?: number
  limit?: number
}

export const DEFAULT_EMERGENCY_CONTACT_PARAMS: EmergencyContactParams = {
  search: '',
  page: 0,
  limit: 10
}

export const fetchEmergencyContacts = createAsyncThunk(
  'emergencyContacts/fetch',
  async (params: EmergencyContactParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('v2/admin/emergency-contacts', { params })
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const createEmergencyContact = createAsyncThunk(
  'emergencyContacts/create',
  async (data: { userId: string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`v2/admin/emergency-contacts/${data.userId}`, data.payload)
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const updateEmergencyContact = createAsyncThunk(
  'emergencyContacts/update',
  async (data: { userId: string; contactId: string; payload: any }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`v2/admin/emergency-contacts/${data.userId}/${data.contactId}`, data.payload)
      return response.data
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

export const deleteEmergencyContact = createAsyncThunk(
  'emergencyContacts/delete',
  async (data: { userId: string; contactId: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`v2/admin/emergency-contacts/${data.userId}/${data.contactId}`)
      return { ...response.data, contactId: data.contactId }
    } catch (error) {
      modifyError(error)
      return rejectWithValue(error)
    }
  }
)

const emergencyContactsSlice = createSlice({
  name: 'emergencyContacts',
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
    builder.addCase(fetchEmergencyContacts.pending, state => {
      state.isLoading = true
    })
    builder.addCase(fetchEmergencyContacts.fulfilled, (state, action) => {
      state.isLoading = false
      state.data = action.payload.data || []
      state.total = action.payload.total || 0
    })
    builder.addCase(fetchEmergencyContacts.rejected, state => {
      state.isLoading = false
    })
  }
})

export default emergencyContactsSlice.reducer

