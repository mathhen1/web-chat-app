import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './auth-context'

type AuthResponse = {
  user?: AuthUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAuthUser = useCallback(async (): Promise<AuthUser | null> => {
    const response = await fetch('/api/auth/me', { credentials: 'include' })
    if (!response.ok) return null

    const result = (await response.json()) as AuthResponse
    return result.user ?? null
  }, [])

  const refreshAuth = useCallback(async () => {
    setIsLoading(true)
    try {
      setUser(await fetchAuthUser())
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [fetchAuthUser])

  useEffect(() => {
    let isActive = true

    fetchAuthUser()
      .then((authenticatedUser) => {
        if (isActive) setUser(authenticatedUser)
      })
      .catch(() => {
        if (isActive) setUser(null)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [fetchAuthUser])

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}
