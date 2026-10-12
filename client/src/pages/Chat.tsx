import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import AppNavbar from '../components/AppNavbar'
import LeaveChatButton from '../components/LeaveChatButton'
import RoomSettingsModal from '../components/RoomSettingsModal'
import { useAuth } from '../hooks/useAuth'
import { getChatById, type ChatSummary } from '../services/chat.service'
import type {
  ChatClientToServerEvents,
  ChatMessage,
  ChatServerToClientEvents,
  ChatSocketResult,
  SendMessageResult,
} from '../services/message.service'

type ChatNavigationState = { password?: string }
type ChatSocket = Socket<ChatServerToClientEvents, ChatClientToServerEvents>

export default function Chat() {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const roomPassword = (location.state as ChatNavigationState | null)?.password
  const { user } = useAuth()
  const [chat, setChat] = useState<ChatSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [roomError, setRoomError] = useState('')
  const [sendError, setSendError] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const socketRef = useRef<ChatSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let isActive = true
    let socket: ChatSocket | undefined
    setIsLoading(true)
    setRoomError('')
    setSendError('')
    setChat(null)
    setMessages([])
    setIsConnected(false)
    setIsSettingsOpen(false)

    getChatById(id, roomPassword)
      .then((room) => {
        if (!isActive) return
        setChat(room)
        socket = io({ path: '/socket.io', withCredentials: true })
        socketRef.current = socket
        socket.on('connect', () => {
          socket?.emit('chat:join', { id: room.id, password: roomPassword }, (result: ChatSocketResult) => {
            if (!isActive) return
            if (!result.ok) {
              setRoomError(result.message ?? 'Não foi possível entrar nesta sala.')
              socket?.disconnect()
              return
            }
            setChat(result.chat ?? room)
            setMessages(result.messages ?? [])
            setIsConnected(true)
          })
        })
        socket.on('chat:message', (message) => {
          if (isActive) setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message])
        })
        socket.on('chat:members-updated', ({ chatId, members }) => {
          if (!isActive || chatId !== room.id) return
          setChat((current) => (current ? { ...current, members } : current))
        })
        socket.on('chat:membership-removed', ({ chatId }) => {
          if (!isActive || chatId !== room.id) return
          setRoomError('Você saiu desta sala.')
          setIsConnected(false)
          socket?.disconnect()
          navigate('/chats', { replace: true })
        })
        socket.on('connect_error', (error) => {
          if (!isActive) return
          setRoomError(error.message || 'Não foi possível conectar à sala em tempo real.')
        })
        socket.on('chat:deleted', (event) => {
          if (event.id === room.id) {
            setRoomError('Esta sala foi removida pelo autor.')
            setIsConnected(false)
            socket?.disconnect()
          }
        })
      })
      .catch((error: unknown) => {
        if (isActive) setRoomError(error instanceof Error ? error.message : 'Não foi possível carregar esta sala.')
      })
      .finally(() => { if (isActive) setIsLoading(false) })

    return () => {
      isActive = false
      socketRef.current = null
      socket?.disconnect()
    }
  }, [id, navigate, roomPassword])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || !chat || !socketRef.current || !isConnected) {
      return
    }
    setSendError('')
    socketRef.current.emit('message:send', { chatId: chat.id, content }, (result: SendMessageResult) => {
      if (!result.ok) {
        setSendError(result.message ?? 'Não foi possível enviar a mensagem.')
        return
      }

      setDraft('')
    })
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <AppNavbar />

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6">
        {isLoading ? (
          <div className="grid flex-1 place-items-center text-sm text-slate-400">
            Carregando sala...
          </div>
        ) : roomError && !chat ? (
          <div className="grid flex-1 place-items-center">
            <div className="max-w-md text-center">
              <p role="alert" className="text-rose-300">
                {roomError}
              </p>
              <Link
                to="/chats"
                className="mt-5 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Voltar para salas
              </Link>
            </div>
          </div>
        ) : chat ? (
          <>
            <div className="mb-5 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <Link
                to="/chats"
                aria-label="Voltar para salas públicas"
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                ←
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">
                  {chat.visible ? 'Sala pública' : 'Sala privada'} · #{chat.id}
                </p>
                <h1 className="mt-1 truncate text-lg font-semibold">{chat.name}</h1>
                {chat.description && (
                  <p className="mt-1 truncate text-sm text-slate-400">
                    {chat.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`hidden rounded-full px-3 py-1 text-xs sm:inline-flex ${
                    isConnected
                      ? 'bg-emerald-400/10 text-emerald-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isConnected
                    ? `${chat.members} na sala`
                    : roomError
                      ? 'Desconectado'
                      : 'Conectando...'}
                </span>
                <LeaveChatButton
                  chatId={chat.id}
                  chatName={chat.name}
                  onLeft={() => navigate('/chats', { replace: true })}
                />
                {user?.id === chat.author && (
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    aria-label="Configurações da sala"
                    title="Configurações da sala"
                    className="grid size-10 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      className="size-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="flex min-h-[55vh] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
              {roomError && (
                <p role="alert" className="border-b border-rose-900/50 px-5 py-3 text-sm text-rose-300">
                  {roomError}
                </p>
              )}
              <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7" aria-live="polite">
                {messages.length === 0 ? (
                  <div className="grid min-h-56 place-items-center text-center">
                    <div>
                      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-300">
                        #
                      </div>
                      <h2 className="mt-4 text-lg font-semibold">
                        {isConnected ? `Você entrou em ${chat.name}` : chat.name}
                      </h2>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Ainda não há mensagens nesta sala. Comece a conversa.
                      </p>
                    </div>
                  </div>
                ) : messages.map((message) => (
                  <article key={message.id} className="flex items-start gap-3">
                    <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-800">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="size-5 text-slate-500"
                      >
                        <circle cx="12" cy="8" r="3.5" />
                        <path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                      </svg>
                      <img
                        src={`/api/users/${encodeURIComponent(message.author.username)}/photo`}
                        alt={`Foto de perfil de ${message.author.username}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                        className="absolute inset-0 size-full rounded-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <Link
                          to={`/${message.author.username}`}
                          className="text-sm font-semibold hover:text-cyan-300"
                        >
                          {message.author.username}
                        </Link>
                        <time
                          className="text-xs text-slate-500"
                          dateTime={`${message.date} ${message.timestamp}`}
                        >
                          {message.date} · {message.timestamp}
                        </time>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                        {message.content}
                      </p>
                    </div>
                  </article>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="border-t border-slate-800 p-4 sm:p-5">
                {sendError && (
                  <p role="alert" className="mb-3 text-sm text-rose-300">
                    {sendError}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={2000}
                    disabled={!isConnected}
                    aria-label={`Mensagem para ${chat.name}`}
                    placeholder={
                      isConnected ? `Mensagem em ${chat.name}` : 'Conectando à sala...'
                    }
                    className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!isConnected || !draft.trim()}
                    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Enviar
                  </button>
                </div>
                <p className="mt-2 text-right text-xs text-slate-600">{draft.length}/2000</p>
              </form>
            </div>
          </>
        ) : null}
      </section>
      {isSettingsOpen && chat && (
        <RoomSettingsModal
          chat={chat}
          onClose={() => setIsSettingsOpen(false)}
          onDeleted={() => navigate('/chats', { replace: true })}
        />
      )}
    </main>
  )
}
