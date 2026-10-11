import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import CreateRoomButton from '../components/CreateRoomButton'
import { useAuth } from '../contexts/AuthContext'
import { getChatById, type ChatSummary } from '../services/chat.service'

type ChatNavigationState = {
  password?: string
}

type ChatSocketResult = {
  ok: boolean
  message?: string
  chat?: ChatSummary
}

export default function Chat() {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const roomPassword = (location.state as ChatNavigationState | null)?.password
  const { user } = useAuth()
  const [chat, setChat] = useState<ChatSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [roomError, setRoomError] = useState('')
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    let isActive = true
    let socket: Socket | undefined

    setIsLoading(true)
    setRoomError('')
    setChat(null)
    setIsConnected(false)

    getChatById(id, roomPassword)
      .then((room) => {
        if (!isActive) return
        setChat(room)

        socket = io({ path: '/socket.io', withCredentials: true })
        socket.on('connect', () => {
          socket?.emit('chat:join', { id: room.id, password: roomPassword }, (result: ChatSocketResult) => {
            if (!isActive) return
            if (!result.ok) {
              setRoomError(result.message ?? 'Não foi possível entrar nesta sala.')
              socket?.disconnect()
              return
            }

            setChat(result.chat ?? room)
            setIsConnected(true)
          })
        })
        socket.on('connect_error', (error) => {
          if (!isActive) return
          setRoomError(error.message || 'Não foi possível conectar à sala em tempo real.')
        })
        socket.on('chat:deleted', (event: { id: number }) => {
          if (event.id === room.id) {
            setRoomError('Esta sala foi removida pelo autor.')
            setIsConnected(false)
            socket?.disconnect()
          }
        })
      })
      .catch((error: unknown) => {
        if (!isActive) return
        setRoomError(error instanceof Error ? error.message : 'Não foi possível carregar esta sala.')
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
      socket?.disconnect()
    }
  }, [id, roomPassword])

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
            WebChat
          </Link>
          <div className="flex items-center gap-3 text-sm sm:gap-5">
            <Link to="/chats" className="text-slate-300 transition hover:text-white">Todas as salas</Link>
            <CreateRoomButton />
            <Link to={`/${user?.username ?? ''}`} className="text-slate-300 transition hover:text-white">Meu perfil</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6">
        {isLoading ? (
          <div className="grid flex-1 place-items-center text-sm text-slate-400">Carregando sala...</div>
        ) : roomError && !chat ? (
          <div className="grid flex-1 place-items-center">
            <div className="max-w-md text-center">
              <p role="alert" className="text-rose-300">{roomError}</p>
              <Link to="/chats" className="mt-5 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300">Voltar para salas</Link>
            </div>
          </div>
        ) : chat ? (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Link to="/chats" aria-label="Voltar para salas públicas" className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300">←</Link>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">{chat.visible ? 'Sala pública' : 'Sala privada'} · #{chat.id}</p>
                <h1 className="mt-1 truncate text-lg font-semibold">{chat.name}</h1>
                {chat.description && <p className="mt-1 truncate text-sm text-slate-400">{chat.description}</p>}
              </div>
              <span className={`hidden rounded-full px-3 py-1 text-xs sm:inline-flex ${isConnected ? 'bg-emerald-400/10 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {isConnected ? `${chat.members} na sala` : roomError ? 'Desconectado' : 'Conectando...'}
              </span>
            </div>

            <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-7">
              {roomError && <p role="alert" className="mb-4 text-sm text-rose-300">{roomError}</p>}
              <div className="grid flex-1 place-items-center text-center">
                <div>
                  <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-300">#</div>
                  <h2 className="mt-4 text-lg font-semibold">{isConnected ? `Você entrou em ${chat.name}` : chat.name}</h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">As mensagens aparecerão aqui quando o envio e o histórico de mensagens forem conectados.</p>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-slate-700 px-4 py-3 text-center text-xs text-slate-500">
                {isConnected ? 'Sala em tempo real conectada' : 'Conectando à sala'} · mensagens ainda não estão implementadas
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  )
}
