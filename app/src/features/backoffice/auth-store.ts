import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type AuthState = {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'admin'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

export const useBackofficeAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: (username, password) => {
        const isValid = username === ADMIN_USER && password === ADMIN_PASSWORD
        if (isValid) {
          set({ isAuthenticated: true })
        }
        return isValid
      },
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'backoffice-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated }),
    },
  ),
)
