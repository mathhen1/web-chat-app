import { createContext } from 'react'

export type AuthUser = {
  id: string
  username: string
}

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  refreshAuth: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
