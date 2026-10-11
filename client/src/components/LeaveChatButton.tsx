import { useState } from 'react'
import { leaveChat } from '../services/chat.service'

type LeaveChatButtonProps = {
  chatId: number
  chatName: string
  onLeft: () => void
}

export default function LeaveChatButton({
  chatId,
  chatName,
  onLeft,
}: LeaveChatButtonProps) {
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [error, setError] = useState('')

  const handleLeave = async (): Promise<void> => {
    setIsLeaving(true)
    setError('')

    try {
      await leaveChat(chatId)
      onLeft()
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível sair desta sala.',
      )
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirmationOpen(true)}
        className="rounded-lg border border-rose-400/40 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-400/10"
      >
        Sair da sala
      </button>

      {isConfirmationOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-chat-title"
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-8"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">
              Sala #{chatId}
            </p>
            <h2 id="leave-chat-title" className="mt-2 text-2xl font-semibold">
              Sair desta sala?
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Você deixará de fazer parte de “{chatName}”. Poderá entrar novamente
              depois.
            </p>

            {error && (
              <p role="alert" className="mt-4 text-sm text-rose-300">
                {error}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3 border-t border-slate-800 pt-5">
              <button
                type="button"
                onClick={() => setIsConfirmationOpen(false)}
                disabled={isLeaving}
                className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleLeave()}
                disabled={isLeaving}
                className="rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-wait disabled:opacity-60"
              >
                {isLeaving ? 'Saindo...' : 'Confirmar saída'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
