import { create } from 'zustand'

interface AppState {
  loading: boolean
  loadingText?: string
  setLoading: (loading: boolean, text?: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  loading: false,
  loadingText: undefined,
  setLoading: (loading, text) => set({ loading, loadingText: text }),
}))
