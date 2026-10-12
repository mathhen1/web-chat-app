import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './auth-context'

type AuthResponse = {
  user?: AuthUser
}

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
