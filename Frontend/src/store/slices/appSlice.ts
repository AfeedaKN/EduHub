import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  appName: string;
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
  lastPing: string | null;
}

const initialState: AppState = {
  appName: 'EduHub',
  isSidebarOpen: true,
  theme: 'light',
  lastPing: null,
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLastPing: (state, action: PayloadAction<string>) => {
      state.lastPing = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme, setLastPing } = appSlice.actions;
export default appSlice.reducer;
