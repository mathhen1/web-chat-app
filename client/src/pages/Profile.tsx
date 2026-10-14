import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AppNavbar from '../components/AppNavbar'
import FriendshipPanel from '../components/FriendshipPanel'
import JoinedChats from '../components/JoinedChats'
import ProfileEditModal from '../components/ProfileEditModal'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../services/auth.service'
import { getPublicUser, type PublicUser } from '../services/user.service'

export default function Profile() {
  const { username = '' } = useParams<{ username: string }>()
  return <ProfilePage key={username} username={username} />
}

function ProfilePage({ username }: { username: string }) {
  const { user, refreshAuth } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const isOwnProfile = Boolean(profile && user?.id === profile.id)

  const handleProfileUpdated = (updatedProfile: PublicUser): void => {
    setProfile({
      ...updatedProfile,
      profilePhoto: updatedProfile.profilePhoto
        ? `${updatedProfile.profilePhoto}?v=${Date.now()}`
        : null,
    })
    setIsEditModalOpen(false)
    void refreshAuth()
    if (updatedProfile.username !== username) {
      navigate(`/${updatedProfile.username}`, { replace: true })
    }
  }

  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true)
    setLogoutError('')

    try {
      await logout()
      await refreshAuth()
      navigate('/login', { replace: true })
    } catch (reason: unknown) {
      setLogoutError(
        reason instanceof Error ? reason.message : 'Não foi possível encerrar a sessão.',
      )
      setIsLoggingOut(false)
    }
  }

  useEffect(() => {
    let isCurrentRequest = true
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
      <AppNavbar />

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
              <div className="-mt-12 grid size-24 place-items-center overflow-hidden rounded-full border-4 border-slate-900 bg-slate-800">
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={`Foto de perfil de ${profile.username}`}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="size-10 text-slate-500"
                  >
                    <circle cx="12" cy="8" r="3.5" />
                    <path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                  </svg>
                )}
              </div>
              <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-medium text-cyan-300">{isOwnProfile ? 'Seu perfil' : 'Perfil público'}</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight">@{profile.username}</h1>
                  {profile.status && (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                      {profile.status}
                    </p>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="rounded-lg border border-cyan-400/60 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
                    >
                      Editar Perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      disabled={isLoggingOut}
                      className="rounded-lg border border-rose-400/50 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoggingOut ? 'Saindo...' : 'Sair da conta'}
                    </button>
                  </div>
                )}
              </div>
              {logoutError && (
                <p role="alert" className="mt-4 text-sm text-rose-300">
                  {logoutError}
                </p>
              )}
              <FriendshipPanel profile={profile} isOwnProfile={isOwnProfile} />
              {isOwnProfile && <JoinedChats />}
            </div>
          </div>
        )}
      </section>
      {isEditModalOpen && isOwnProfile && profile && (
        <ProfileEditModal
          user={profile}
          onClose={() => setIsEditModalOpen(false)}
          onUpdated={handleProfileUpdated}
        />
      )}
    </main>
  )
}
