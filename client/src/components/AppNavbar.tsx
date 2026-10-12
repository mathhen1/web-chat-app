import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CreateRoomButton from './CreateRoomButton'

export default function AppNavbar() {
  const { user } = useAuth()
  const [usernameSearch, setUsernameSearch] = useState('')
  const [searchMessage, setSearchMessage] = useState('')

  const handleSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const searchedUsername = usernameSearch.trim()
    if (!searchedUsername) return

    setSearchMessage(`A busca por @${searchedUsername} estará disponível em breve.`)
  }

  return (
    <header className="border-b border-slate-800">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">
            w
          </span>
          WebChat
        </Link>

        <form onSubmit={handleSearch} className="relative order-3 w-full sm:order-none sm:w-56 lg:w-72">
          <div className="flex overflow-hidden rounded-lg border border-slate-700 bg-slate-900 focus-within:border-cyan-400">
            <input
              type="search"
              aria-label="Buscar usuário pelo nome"
              placeholder="Buscar usuário"
              value={usernameSearch}
              onChange={(event) => {
                setUsernameSearch(event.currentTarget.value)
                setSearchMessage('')
              }}
              className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
            <button
              type="submit"
              aria-label="Pesquisar usuário"
              title="Pesquisar usuário"
              disabled={!usernameSearch.trim()}
              className="grid size-10 shrink-0 place-items-center text-slate-400 transition hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-5"
              >
                <circle cx="10.8" cy="10.8" r="6.3" />
                <path strokeLinecap="round" d="m15.5 15.5 4 4" />
              </svg>
            </button>
          </div>
          {searchMessage && (
            <p role="status" className="absolute mt-1 text-xs text-slate-400">
              {searchMessage}
            </p>
          )}
        </form>

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
