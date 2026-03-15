// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import apiClient from 'src/utils/api-client';
import { ICreateRoleType, IUpdateRoleType } from 'src/views/apps/roles/GenericModal/useCreateOrUpdateRole';


// ** Fetch Roles
export const fetchRoles = createAsyncThunk('appRoles/fetchRoles', async () => {
  const response = await apiClient.get('v2/roles');

  return response.data;
})

// ** Add Role
export const addRole = createAsyncThunk(
  'appRoles/addRole',
  async (data: ICreateRoleType, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('v2/roles/new', data);

      return response.data
    } catch (e) {
      return rejectWithValue(e)
    }
  }
)

// ** Update Role
export const updateRole = createAsyncThunk(
  'appRoles/updateRole',
  async (payload: IUpdateRoleType, { rejectWithValue }) => {
    try {
      const { id, ...payloadWithoutId } = payload;
      const response = await apiClient.put(`v2/roles/${id}`, payloadWithoutId);

      return response.data
    } catch (e) {
      return rejectWithValue(e)
    }
  }
)

// ** Get Role Stats
export const getAllRolesStats = createAsyncThunk(
  'appRoles/getAllRolesStats',
  async () => {
    const response = await apiClient.get('v2/roles/stats/all');

    return response.data;
  }
)

// ** Get All Roles
export const getAllRoles = createAsyncThunk(
  'appRoles/getAllRoles',
  async () => {
    const response = await apiClient.get('v2/roles/listAll');

    return response.data;
  }
)

export const appRolesSlice = createSlice({
  name: 'appRoles',
  initialState: {
    cardData: [],
    roles: []
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(getAllRolesStats.fulfilled, (state, action) => {
      state.cardData = action.payload;
    });
    builder.addCase(getAllRoles.fulfilled, (state, action) => {
      state.roles = action.payload;
    })
  }
})

export default appRolesSlice.reducer
