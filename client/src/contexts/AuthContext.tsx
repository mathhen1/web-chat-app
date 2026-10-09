import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type AuthUser = {
  id: string
  username: string
}

type AuthResponse = {
  user?: AuthUser
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshAuth = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (!response.ok) {
        setUser(null)
        return
      }

      const result = (await response.json()) as AuthResponse
      setUser(result.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshAuth()
  }, [refreshAuth])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }
  return context
}
