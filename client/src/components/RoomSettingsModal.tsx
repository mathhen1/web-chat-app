import { useState } from 'react'
import { deleteChat, type ChatSummary } from '../services/chat.service'

type RoomSettingsModalProps = {
  chat: ChatSummary
  onClose: () => void
  onDeleted: () => void
}

export default function RoomSettingsModal({ chat, onClose, onDeleted }: RoomSettingsModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true)
    setError('')
    try {
      await deleteChat(chat.id)
      onDeleted()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível deletar a sala.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose()
        }
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="room-settings-title" className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">#{chat.id} · {chat.name}</p>
            <h2 id="room-settings-title" className="mt-2 text-2xl font-semibold">Configurações da sala</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white">×</button>
        </div>

        <div className="mt-7 rounded-xl border border-rose-400/20 bg-rose-400/5 p-4">
          <div>
            <h3 className="font-medium text-slate-100">Excluir sala</h3>
            <p className="mt-1 text-sm leading-5 text-slate-400">Remove a sala e encerra a conversa para todos os participantes.</p>
          </div>
          {!confirmingDelete ? (
            <button type="button" onClick={() => { setError(''); setConfirmingDelete(true) }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-rose-400/40 px-3.5 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/10">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2m3 0-.9 14H5.9L5 6m4 4v6m6-6v6" /></svg>
              Deletar sala
            </button>
          ) : (
            <div className="mt-4 rounded-lg border border-rose-400/30 bg-slate-950/70 p-4">
              <p className="text-sm font-medium text-slate-100">
                Tem certeza que deseja deletar “{chat.name}”?
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Esta ação não pode ser desfeita.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmingDelete(false)} disabled={isDeleting} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={() => void handleDelete()} disabled={isDeleting} className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-wait disabled:opacity-60">{isDeleting ? 'Deletando...' : 'Sim, deletar'}</button>
              </div>
            </div>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-800 pt-5">
          <button type="button" onClick={onClose} disabled={isDeleting} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">Fechar</button>
        </div>
      </section>
    </div>
  )
}
