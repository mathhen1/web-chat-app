import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
          WebChat
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/chats" className="text-slate-300 transition hover:text-white">Salas públicas</Link>
          <Link to={`/${user?.username ?? ''}`} className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300">
            {user?.username}
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-12">
        <p className="mb-5 text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">Sua área de conversas</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
          Olá, {user?.username}.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
          Sua conta está pronta. Em breve, suas conversas aparecerão por aqui.
        </p>
        <div className="mt-10 inline-flex w-fit items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm text-slate-300">
          <span className="size-2 rounded-full bg-emerald-400" />
          Sessão autenticada
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-slate-500">
        WebChat · Feito para conversas melhores
      </footer>
    </main>
  )
}
