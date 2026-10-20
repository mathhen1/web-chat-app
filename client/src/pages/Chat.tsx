import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { io, type Socket } from 'socket.io-client'
import AppNavbar from '../components/AppNavbar'
import LeaveChatButton from '../components/LeaveChatButton'
import RoomSettingsModal from '../components/RoomSettingsModal'
import { useAuth } from '../hooks/useAuth'
import { getChatById, type ChatSummary } from '../services/chat.service'
import { deleteChatMessage } from '../services/message.service'
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
  const roomPassword = (location.state as ChatNavigationState | null)?.password
  return <ChatRoom key={`${id}:${roomPassword ?? ''}`} id={id} roomPassword={roomPassword} />
}

function ChatRoom({ id, roomPassword }: { id: string; roomPassword?: string }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [chat, setChat] = useState<ChatSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [roomError, setRoomError] = useState('')
  const [sendError, setSendError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [openMenuMessageId, setOpenMenuMessageId] = useState<string | null>(null)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const socketRef = useRef<ChatSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const previousMessageCountRef = useRef(0)

  useEffect(() => {
    let isActive = true
    let socket: ChatSocket | undefined

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
        socket.on('chat:message-deleted', ({ chatId, messageId }) => {
          if (!isActive || chatId !== room.id) return
          setMessages((current) => current.filter((message) => message.id !== messageId))
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
    if (messages.length > previousMessageCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    previousMessageCountRef.current = messages.length
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

  const removeMessage = async (messageId: string): Promise<void> => {
    setDeleteError('')
    setDeletingMessageId(messageId)
    setOpenMenuMessageId(null)

    try {
      await deleteChatMessage(messageId)
      setMessages((current) => current.filter((message) => message.id !== messageId))
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : 'Não foi possível apagar a mensagem.')
    } finally {
      setDeletingMessageId(null)
    }
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div className="shrink-0">
        <AppNavbar />
      </div>

      <section className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 md:flex-row md:gap-4 lg:gap-6">
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
            <aside className="flex shrink-0 flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 md:w-56 lg:w-64 xl:w-72">
              <Link
                to="/chats"
                aria-label="Voltar para salas públicas"
                className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                ←
              </Link>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">
                  {chat.visible ? 'Sala pública' : 'Sala privada'} · #{chat.id}
                </p>
                <h1 className="mt-2 break-words text-xl font-semibold">{chat.name}</h1>
                {chat.description && (
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">
                    {chat.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-start gap-3 border-t border-slate-800 pt-4">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs ${
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
                    className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
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
                    Configurações da sala
                  </button>
                )}
              </div>
            </aside>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
              {roomError && (
                <p role="alert" className="border-b border-rose-900/50 px-5 py-3 text-sm text-rose-300">
                  {roomError}
                </p>
              )}
              <div className="chat-messages-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7" aria-live="polite">
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
                ) : messages.map((message) => {
                  const canDeleteMessage =
                    user?.id === message.author.id || user?.id === chat.author

                  return (
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
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        aria-label={`Opções da mensagem de ${message.author.username}`}
                        aria-haspopup="menu"
                        aria-expanded={openMenuMessageId === message.id}
                        title={
                          canDeleteMessage
                            ? 'Opções da mensagem'
                            : 'Você não pode apagar esta mensagem'
                        }
                        disabled={!canDeleteMessage || deletingMessageId === message.id}
                        onClick={() =>
                          setOpenMenuMessageId((current) =>
                            current === message.id ? null : message.id,
                          )
                        }
                        className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="size-5"
                        >
                          <circle cx="12" cy="5" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="12" cy="19" r="1.8" />
                        </svg>
                      </button>
                      {openMenuMessageId === message.id && canDeleteMessage && (
                        <div
                          role="menu"
                          className="absolute right-0 top-full z-20 mt-1 min-w-44 rounded-lg border border-slate-700 bg-slate-900 p-1 shadow-xl"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            disabled={deletingMessageId === message.id}
                            onClick={() => void removeMessage(message.id)}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"
                          >
                            <svg
                              aria-hidden="true"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.7"
                              className="size-4"
                            >
                              <path strokeLinecap="round" d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
                            </svg>
                            Deletar mensagem
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} className="border-t border-slate-800 p-4 sm:p-5">
                {deleteError && (
                  <p role="alert" className="mb-3 text-sm text-rose-300">
                    {deleteError}
                  </p>
                )}
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
