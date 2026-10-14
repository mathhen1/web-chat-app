import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJoinedChats, type ChatSummary } from '../services/chat.service'

export default function JoinedChats() {
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrentRequest = true

    getJoinedChats()
      .then((joinedChats) => {
        if (isCurrentRequest) {
          setChats(joinedChats)
        }
      })
      .catch((reason: unknown) => {
        if (isCurrentRequest) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Não foi possível carregar suas salas.',
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
  }, [])

  return (
    <section className="mt-12 border-t border-slate-800 pt-8">
      <div>
        <h2 className="text-xl font-semibold">Minhas salas</h2>
        <p className="mt-2 text-sm text-slate-500">
          Salas em que você entrou anteriormente.
        </p>
      </div>

      {isLoading && (
        <p className="mt-6 text-sm text-slate-400">Carregando suas salas...</p>
      )}

      {error && (
        <p role="alert" className="mt-6 text-sm text-rose-300">
          {error}
        </p>
      )}

      {!isLoading && !error && chats.length === 0 && (
        <p className="mt-6 rounded-xl border border-dashed border-slate-800 px-5 py-8 text-center text-sm text-slate-500">
          Você ainda não entrou em nenhuma sala.
        </p>
      )}

      {chats.length > 0 && (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {chats.map((chat) => (
            <article
              key={chat.id}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">
                {chat.visible ? 'Sala pública' : 'Sala privada'} · #{chat.id}
              </p>
              <h3 className="mt-3 text-xl font-semibold">{chat.name}</h3>
              {chat.description && (
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">
                  {chat.description}
                </p>
              )}
              <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-xs text-slate-500">
                  {chat.members} participantes
                </span>
                <Link
                  to={`/chat/${chat.id}`}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Abrir sala
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
