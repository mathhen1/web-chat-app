import { Link } from 'react-router-dom'

function App() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
          WebChat
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link to="/login" className="text-slate-300 transition hover:text-white">Entrar</Link>
          <Link to="/register" className="rounded-lg bg-cyan-400 px-4 py-2 text-slate-950 transition hover:bg-cyan-300">Criar conta</Link>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-12">
        <p className="mb-5 text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">Conversas em tempo real</p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">Um espaço simples para conversar.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">Estamos preparando um jeito rápido e seguro de manter suas conversas em um só lugar.</p>
        <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
          </span>
          O projeto está começando
        </div>
      </section>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-slate-500">WebChat · Feito para conversas melhores</footer>
    </main>
  )
}

export default App
