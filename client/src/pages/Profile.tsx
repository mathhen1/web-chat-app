import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { username = '' } = useParams<{ username: string }>()
  const { user } = useAuth()
  const isOwnProfile = user?.username.toLowerCase() === username.toLowerCase()
  const displayName = username || 'Usuário'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
            WebChat
          </Link>
          <Link to="/chats" className="text-sm text-slate-300 transition hover:text-white">Salas públicas</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
          <div className="h-36 bg-gradient-to-r from-cyan-500/30 via-slate-800 to-slate-900 sm:h-48" />
          <div className="px-6 pb-8 sm:px-10 sm:pb-10">
            <div className="-mt-12 grid size-24 place-items-center rounded-3xl border-4 border-slate-900 bg-cyan-400 text-3xl font-semibold uppercase text-slate-950">
              {displayName[0]}
            </div>
            <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-medium text-cyan-300">{isOwnProfile ? 'Seu perfil' : 'Perfil público'}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight">{displayName}</h1>
                <p className="mt-2 text-sm text-slate-500">Membro do WebChat</p>
              </div>
              {isOwnProfile ? (
                <span className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400">Este é o seu perfil</span>
              ) : (
                <button type="button" className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Enviar mensagem</button>
              )}
            </div>

            <div className="mt-8 grid gap-4 border-t border-slate-800 pt-7 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Sobre</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">{isOwnProfile ? 'Adicione uma descrição para contar um pouco sobre você.' : `${displayName} ainda não adicionou uma descrição.`}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Atividade</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">As conversas e salas frequentadas aparecerão aqui.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
