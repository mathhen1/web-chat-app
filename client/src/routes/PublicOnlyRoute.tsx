import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-sm text-slate-400">
        Verificando sessão...
      </main>
    )
  }

  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />
}
