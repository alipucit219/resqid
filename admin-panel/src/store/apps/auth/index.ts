// ** Redux Imports
import { createSlice } from '@reduxjs/toolkit'

interface DataParams {
  accessToken: string
  user: Record<string, any>
  qrCode: string
  secretKey: string
  isTwofa: boolean
  isSessionAuthenticatedToPreviewPasswords: boolean
  permissionsAllow: []
}

export const initialState: DataParams = {
  accessToken: '',
  user: {},
  qrCode: '',
  secretKey: '',
  isTwofa: false,
  isSessionAuthenticatedToPreviewPasswords: false,
  permissionsAllow: []
}

export const appAuthSlice = createSlice({
  name: 'appAuth',
  initialState,
  reducers: {
    resetUserState: (state: any) => {
      state.user = {}
    },

    saveUserData: (state: any, action: any) => {
      state.user = action.payload
    },

    saveAccessToken: (state: any, action: any) => {
      state.accessToken = action.payload
    },

    setQrCode: (state: any, action: any) => {
      state.qrCode = action.payload
    },
    setSecretKey: (state: any, action: any) => {
      state.secretKey = action.payload
    },
    setAuthenticatedToPreviewPasswords: (state, action) => {
      state.isSessionAuthenticatedToPreviewPasswords = action.payload
    },
    setIsTwofa: (state, action) => {
      state.isTwofa = action.payload
    },
    resetAuth: state => {
      state.user = {}
      state.accessToken = ''
      state.qrCode = ''
      state.secretKey = ''
      state.isTwofa = false
      state.isSessionAuthenticatedToPreviewPasswords = false
    },
    setPermissionforApproval: (state, action) => {
      state.permissionsAllow = action.payload
    }
  }
})

export const {
  saveAccessToken,
  resetUserState,
  saveUserData,
  setQrCode,

  setSecretKey,
  resetAuth,
  setIsTwofa,
  setAuthenticatedToPreviewPasswords,
  setPermissionforApproval
} = appAuthSlice.actions
export default appAuthSlice.reducer
