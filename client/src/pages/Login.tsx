import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type User = {
  username: string
  password: string
}

type LoginResponse = {
  message?: string
  error?: string
}

export default function Login() {
  const [user, setUser] = useState<User>({ username: '', password: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isError, setIsError] = useState(false)
  const { refreshAuth } = useAuth()
  const navigate = useNavigate()

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget
    setUser((currentUser) => ({ ...currentUser, [name]: value }))
  }

  const handleLogin = async (credentials: User) => {
    setIsSubmitting(true)
    setFeedback('')
    setIsError(false)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      })
      const result = (await response.json()) as LoginResponse

      if (!response.ok) {
        throw new Error(result.error ?? 'Não foi possível entrar na sua conta.')
      }

      await refreshAuth()
      navigate('/home', { replace: true })
    } catch (error) {
      setIsError(true)
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Não foi possível conectar ao servidor. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleLogin(user)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <section className="w-full max-w-md">
        <Link to="/" className="mb-10 inline-flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
          WebChat
        </Link>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/20">
          <p className="text-sm font-medium text-cyan-300">Que bom ter você de volta</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Entrar na sua conta</h1>
          <p className="mt-2 text-sm text-slate-400">Use seus dados para continuar suas conversas.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-300">
              Nome de usuário
              <input type="text" name="username" autoComplete="username" placeholder="Seu nome de usuário" value={user.username} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Senha
              <input type="password" name="password" autoComplete="current-password" placeholder="Sua senha" value={user.password} onChange={handleChange} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {feedback && (
            <p role="status" className={`mt-4 text-center text-sm ${isError ? 'text-rose-300' : 'text-emerald-300'}`}>
              {feedback}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-400">
            Ainda não tem conta? <Link to="/register" className="font-medium text-cyan-300 hover:text-cyan-200">Criar conta</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
