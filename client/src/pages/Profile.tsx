import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import CreateRoomButton from '../components/CreateRoomButton'
import { useAuth } from '../contexts/AuthContext'
import { getPublicUser, type PublicUser } from '../services/user.service'

export default function Profile() {
  const { username = '' } = useParams<{ username: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const isOwnProfile = Boolean(profile && user?.id === profile.id)

  useEffect(() => {
    let isCurrentRequest = true
    setIsLoading(true)
    setError('')
    setProfile(null)
    getPublicUser(username)
      .then((result) => {
        if (isCurrentRequest) {
          setProfile(result)
        }
      })
      .catch((reason: unknown) => {
        if (isCurrentRequest) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Não foi possível carregar este perfil.',
          )
        }
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrentRequest = false
    }
  }, [username])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>WebChat
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <Link to="/chats" className="text-sm text-slate-300 transition hover:text-white">Salas públicas</Link>
            <CreateRoomButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        {isLoading ? (
          <p className="py-20 text-center text-sm text-slate-400">Carregando perfil...</p>
        ) : error || !profile ? (
          <div className="py-20 text-center">
            <p role="alert" className="text-rose-300">{error || 'Usuário não encontrado.'}</p>
            <Link to="/chats" className="mt-5 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300">Voltar para salas</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
            <div className="h-36 bg-gradient-to-r from-cyan-500/30 via-slate-800 to-slate-900 sm:h-48" />
            <div className="px-6 pb-8 sm:px-10 sm:pb-10">
              <div className="-mt-12 grid size-24 place-items-center rounded-3xl border-4 border-slate-900 bg-cyan-400 text-3xl font-semibold uppercase text-slate-950">{profile.username[0]}</div>
              <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-medium text-cyan-300">{isOwnProfile ? 'Seu perfil' : 'Perfil público'}</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight">{profile.username}</h1>
                </div>
                {isOwnProfile && <button type="button" disabled className="cursor-not-allowed rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-500" title="Edição de perfil estará disponível em breve">Editar perfil · em breve</button>}
              </div>
              <div className="mt-8 border-t border-slate-800 pt-7">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Informações públicas</p>
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-slate-500">Nome de usuário</p>
                  <p className="mt-2 text-sm text-slate-300">{profile.username}</p>
                </div>
                <p className="mt-4 text-sm text-slate-500">Este perfil ainda não possui outras informações públicas.</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
