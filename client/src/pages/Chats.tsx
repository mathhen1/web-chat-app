import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ChatApiError, getChatById, type ChatSummary } from '../services/chat.service'

export default function Chats() {
  const { user } = useAuth()
  const [roomCode, setRoomCode] = useState('')
  const [searchedChat, setSearchedChat] = useState<ChatSummary | null>(null)
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchedChat(null)
    setSearchError('')
    setIsSearching(true)

    try {
      setSearchedChat(await getChatById(roomCode.trim()))
    } catch (error) {
      setSearchError(
        error instanceof ChatApiError && error.status === 401
          ? 'Esta sala é privada. Informe a senha para acessá-la.'
          : error instanceof Error
            ? error.message
            : 'Não foi possível buscar a sala.',
      )
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
            WebChat
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/chats" className="text-cyan-300">Salas públicas</Link>
            <Link to={`/${user?.username ?? ''}`} className="text-slate-300 transition hover:text-white">Meu perfil</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">Encontre sua conversa</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Salas públicas</h1>
        <p className="mt-4 max-w-2xl text-slate-400">Explore as conversas abertas ou busque uma sala pelo código.</p>

        <form onSubmit={handleSearch} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
          <label htmlFor="room-code" className="sr-only">Código da sala</label>
          <input
            id="room-code"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            value={roomCode}
            onChange={(event) => setRoomCode(event.currentTarget.value)}
            placeholder="Digite o código da sala"
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="rounded-lg bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {searchError && <p role="alert" className="mt-4 text-sm text-rose-300">{searchError}</p>}

        {searchedChat && (
          <article className="mt-6 flex max-w-xl flex-col gap-4 rounded-2xl border border-cyan-400/30 bg-slate-900/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">Sala encontrada · #{searchedChat.id}</p>
              <h2 className="mt-2 text-lg font-semibold">{searchedChat.name}</h2>
              <p className="mt-1 text-sm text-slate-400">{searchedChat.description || 'Sem descrição.'}</p>
            </div>
            <Link to={`/chat/${searchedChat.id}`} className="shrink-0 rounded-lg bg-cyan-400 px-4 py-2 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Entrar na sala
            </Link>
          </article>
        )}

        <div className="mt-14 border-t border-slate-800 pt-8">
          <h2 className="text-xl font-semibold">Salas públicas disponíveis</h2>
          <p className="mt-2 text-sm text-slate-500">A lista de salas será carregada aqui.</p>
        </div>
      </section>
    </main>
  )
}
