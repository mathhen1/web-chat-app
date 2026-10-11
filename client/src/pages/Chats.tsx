import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PrivateRoomModal from '../components/PrivateRoomModal'
import { useAuth } from '../contexts/AuthContext'
import { ChatApiError, getChatById, getPublicChats, type ChatSummary } from '../services/chat.service'

export default function Chats() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [searchedChat, setSearchedChat] = useState<ChatSummary | null>(null)
  const [searchError, setSearchError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [publicRooms, setPublicRooms] = useState<ChatSummary[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [roomsError, setRoomsError] = useState('')
  const [privateRoomId, setPrivateRoomId] = useState('')
  const [privateRoomPassword, setPrivateRoomPassword] = useState('')
  const [privateRoomError, setPrivateRoomError] = useState('')
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isJoiningPrivateRoom, setIsJoiningPrivateRoom] = useState(false)

  useEffect(() => {
    let isCurrentRequest = true
    setIsLoadingRooms(true)
    setRoomsError('')

    getPublicChats(page)
      .then((result) => {
        if (!isCurrentRequest) return
        setPublicRooms(result.chats)
        setTotalPages(result.totalPages)
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest) return
        setRoomsError(error instanceof Error ? error.message : 'Não foi possível carregar as salas.')
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingRooms(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [page])

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchedChat(null)
    setSearchError('')
    setIsSearching(true)

    try {
      setSearchedChat(await getChatById(roomCode.trim()))
    } catch (error) {
      if (error instanceof ChatApiError && error.status === 401) {
        setPrivateRoomId(roomCode.trim())
        setPrivateRoomPassword('')
        setPrivateRoomError('')
        setIsPasswordModalOpen(true)
        return
      }

      setSearchError(
        error instanceof Error ? error.message : 'Não foi possível buscar a sala.',
      )
    } finally {
      setIsSearching(false)
    }
  }

  const handlePrivateRoomSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPrivateRoomError('')
    setIsJoiningPrivateRoom(true)

    try {
      const chat = await getChatById(privateRoomId, privateRoomPassword)
      navigate(`/chat/${chat.id}`, { state: { password: privateRoomPassword } })
    } catch (error) {
      setPrivateRoomError(error instanceof Error ? error.message : 'Não foi possível acessar esta sala.')
    } finally {
      setIsJoiningPrivateRoom(false)
    }
  }

  const closePasswordModal = () => {
    setIsPasswordModalOpen(false)
    setPrivateRoomError('')
    setPrivateRoomPassword('')
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
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Salas públicas disponíveis</h2>
              <p className="mt-2 text-sm text-slate-500">{isLoadingRooms ? 'Carregando salas...' : 'Entre em uma conversa aberta.'}</p>
            </div>
            {totalPages > 0 && (
              <span className="text-sm text-slate-500">Página {page} de {totalPages}</span>
            )}
          </div>

          {roomsError && <p role="alert" className="mt-5 text-sm text-rose-300">{roomsError}</p>}

          {!roomsError && !isLoadingRooms && publicRooms.length === 0 && (
            <p className="mt-6 rounded-xl border border-dashed border-slate-800 px-5 py-8 text-center text-sm text-slate-500">
              Nenhuma sala pública disponível no momento.
            </p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {publicRooms.map((room) => (
              <article key={room.id} className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="mb-5 grid size-12 place-items-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">#</div>
                <h3 className="text-xl font-semibold">{room.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{room.description || 'Sem descrição.'}</p>
                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-xs text-slate-500">#{room.id} · {room.members} participantes</span>
                  <Link to={`/chat/${room.id}`} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Entrar</Link>
                </div>
              </article>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button type="button" onClick={() => setPage((currentPage) => currentPage - 1)} disabled={page <= 1 || isLoadingRooms} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">
                Anterior
              </button>
              <button type="button" onClick={() => setPage((currentPage) => currentPage + 1)} disabled={page >= totalPages || isLoadingRooms} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40">
                Próxima
              </button>
            </div>
          )}
        </div>
      </section>
      {isPasswordModalOpen && (
        <PrivateRoomModal
          roomId={privateRoomId}
          password={privateRoomPassword}
          isSubmitting={isJoiningPrivateRoom}
          error={privateRoomError}
          onPasswordChange={setPrivateRoomPassword}
          onClose={closePasswordModal}
          onSubmit={handlePrivateRoomSubmit}
        />
      )}
    </main>
  )
}
