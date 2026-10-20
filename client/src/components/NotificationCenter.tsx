import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  FRIEND_REQUEST_RECEIVED_EVENT,
  isFriendRequestNotification,
} from '../services/notification.service'

type FriendRequestToast = {
  userId: string
  username: string
}

export default function NotificationCenter() {
  const { user } = useAuth()
  const [toast, setToast] = useState<FriendRequestToast | null>(null)

  useEffect(() => {
    if (!user) return

    const eventSource = new EventSource('/api/notifications/events', {
      withCredentials: true,
    })

    eventSource.addEventListener('friend.request.created', (event: MessageEvent<string>) => {
      try {
        const notification: unknown = JSON.parse(event.data)
        if (!isFriendRequestNotification(notification)) return

        setToast({
          userId: user.id,
          username: notification.sender.username,
        })
        window.dispatchEvent(new Event(FRIEND_REQUEST_RECEIVED_EVENT))
      } catch {
        console.error('Não foi possível ler uma notificação recebida.')
      }
    })

    return () => {
      eventSource.close()
    }
  }, [user])

  useEffect(() => {
    if (!toast) return

    const timeout = window.setTimeout(() => setToast(null), 6_000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  if (!toast || !user || toast.userId !== user.id) return null

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-50 w-[min(24rem,calc(100vw-2rem))]"
    >
      <div className="flex items-start gap-3 rounded-xl border border-cyan-400/30 bg-slate-900 p-4 shadow-2xl shadow-black/40">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-cyan-400/10 text-cyan-300">
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
              d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-100">Novo pedido de amizade</p>
          <p className="mt-1 text-sm text-slate-300">
            @{toast.username} enviou um pedido de amizade.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="Fechar notificação"
          className="rounded p-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-4"
          >
            <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
