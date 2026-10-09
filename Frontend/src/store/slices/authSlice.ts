import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'MANAGEMENT' | 'TEACHER' | 'PARENT' | null;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('eduhub_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getStoredUser(),
  token: localStorage.getItem('eduhub_auth_token') || null,
  isAuthenticated: !!localStorage.getItem('eduhub_auth_token'),
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('eduhub_auth_token', action.payload.token);
      localStorage.setItem('eduhub_auth_user', JSON.stringify(action.payload.user));
    },
    updateUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      localStorage.setItem('eduhub_auth_user', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('eduhub_auth_token');
      localStorage.removeItem('eduhub_auth_user');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, updateUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
