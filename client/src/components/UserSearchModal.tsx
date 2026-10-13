import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPublicUser, type PublicUser } from '../services/user.service'

type UserSearchModalProps = {
  username: string
  onClose: () => void
}

export default function UserSearchModal({ username, onClose }: UserSearchModalProps) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    getPublicUser(username)
      .then((foundProfile) => {
        if (isCurrentRequest) setProfile(foundProfile)
      })
      .catch((reason: unknown) => {
        if (isCurrentRequest) {
          setError(reason instanceof Error ? reason.message : 'Não foi possível buscar este usuário.')
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [username])

  const openProfile = (): void => {
    if (!profile) return
    navigate(`/${profile.username}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 px-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-search-title"
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">
              Pesquisa de usuário
            </p>
            <h2 id="user-search-title" className="mt-2 text-xl font-semibold">
              Perfil encontrado
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid size-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            ×
          </button>
        </div>

        {isLoading && (
          <p className="py-10 text-center text-sm text-slate-400">Buscando usuário...</p>
        )}

        {error && <p role="alert" className="py-8 text-center text-sm text-rose-300">{error}</p>}

        {profile && (
          <div className="mt-7 flex flex-col items-center">
            <div className="relative grid size-20 place-items-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-slate-500">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="size-8"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
              </svg>
              {profile.profilePhoto && (
                <img
                  src={profile.profilePhoto}
                  alt=""
                  aria-hidden="true"
                  onError={(event) => {
                    event.currentTarget.hidden = true
                  }}
                  className="absolute inset-0 size-full rounded-full object-cover"
                />
              )}
            </div>
            <p className="mt-3 text-lg font-semibold">@{profile.username}</p>
          </div>
        )}

        <div className="mt-7 flex justify-end gap-3 border-t border-slate-800 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            Cancelar
          </button>
          {profile && (
            <button
              type="button"
              onClick={openProfile}
              className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Ir ao perfil
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
