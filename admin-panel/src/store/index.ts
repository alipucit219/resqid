import { combineReducers, compose } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import { Action, configureStore, ThunkAction, getDefaultMiddleware, ThunkDispatch, AnyAction } from '@reduxjs/toolkit'
import storage from 'redux-persist/lib/storage'
import ReduxThunk from 'redux-thunk'

// ** Reducers
import user from 'src/store/apps/user'
import permissions from 'src/store/apps/permissions'
import role from 'src/store/apps/role'
import staff from 'src/store/apps/staff'
import auth from 'src/store/apps/auth'
import posCategory from 'src/store/apps/posCategory'
import posSubcategory from 'src/store/apps/posSubcategory'
import posProduct from 'src/store/apps/posProduct'
import posDeal from 'src/store/apps/posDeal'
import posHall from 'src/store/apps/posHall'
import posRoom from 'src/store/apps/posRoom'
import posTable from 'src/store/apps/posTable'
import posSeat from 'src/store/apps/posSeat'
import posToken from 'src/store/apps/posToken'
import posOrder from 'src/store/apps/posOrder'
import medicalProfiles from 'src/store/apps/medicalProfiles'
import emergencyContacts from 'src/store/apps/emergencyContacts'
import medicalSummaries from 'src/store/apps/medicalSummaries'
import qrAccess from 'src/store/apps/qrAccess'
import panicAlerts from 'src/store/apps/panicAlerts'

const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: ['auth'],
  blacklist: [],
  transforms: []
}

const reducers = combineReducers({
  user,
  permissions,
  role,
  staff,
  auth,
  posCategory,
  posSubcategory,
  posProduct,
  posDeal,
  posHall,
  posRoom,
  posTable,
  posSeat,
  posToken,
  posOrder,
  medicalProfiles,
  emergencyContacts,
  medicalSummaries,
  qrAccess,
  panicAlerts
})

const persistedReducer = persistReducer(persistConfig, reducers)

const middleware: any = getDefaultMiddleware({
  serializableCheck: false,
  immutableCheck: false
}).concat(ReduxThunk)

const enhancedCompose = compose

export const store = configureStore({
  reducer: persistedReducer,
  middleware: enhancedCompose(middleware)
})

export const persistor = persistStore(store)

export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>
