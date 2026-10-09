import { Link } from 'react-router-dom'

export default function Register() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <section className="w-full max-w-md">
        <Link to="/" className="mb-10 inline-flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
          WebChat
        </Link>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/20">
          <p className="text-sm font-medium text-cyan-300">Comece por aqui</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Crie sua conta</h1>
          <p className="mt-2 text-sm text-slate-400">Junte-se ao WebChat para começar a conversar.</p>

          <form className="mt-8 space-y-5">
            <label className="block text-sm font-medium text-slate-300">
              Nome
              <input type="text" autoComplete="name" placeholder="Seu nome" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              E-mail
              <input type="email" autoComplete="email" placeholder="voce@exemplo.com" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Senha
              <input type="password" autoComplete="new-password" placeholder="Crie uma senha" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            </label>
            <button type="submit" className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300">Criar conta</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Já tem uma conta? <Link to="/login" className="font-medium text-cyan-300 hover:text-cyan-200">Entrar</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
