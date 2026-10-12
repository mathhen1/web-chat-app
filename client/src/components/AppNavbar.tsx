import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CreateRoomButton from './CreateRoomButton'

export default function AppNavbar() {
  const { user } = useAuth()

  return (
    <header className="border-b border-slate-800">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">
            w
          </span>
          WebChat
        </Link>

        <div className="flex items-center gap-3 text-sm sm:gap-5">
          <Link to="/chats" className="hidden text-cyan-300 sm:inline">
            Salas públicas
          </Link>
          <CreateRoomButton />
          {user && (
            <Link
              to={`/${user.username}`}
              aria-label={`Abrir perfil de ${user.username}`}
              title={user.username}
              className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-700 bg-slate-800 text-slate-500 transition hover:border-cyan-400"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="size-5"
              >
                <circle cx="12" cy="8" r="3.5" />
                <path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
              </svg>
              <img
                src={`/api/users/${encodeURIComponent(user.username)}/photo`}
                alt=""
                aria-hidden="true"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.hidden = true
                }}
                className="absolute size-10 rounded-full object-cover"
              />
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
