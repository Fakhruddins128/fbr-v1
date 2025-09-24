import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import fbrReducer from './slices/fbrSlice';
import companyReducer from './slices/companySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    fbr: fbrReducer,
    company: companyReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;