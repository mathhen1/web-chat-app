import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChatSummary } from '../services/chat.service'

type CreateRoomResponse = {
  chat?: ChatSummary
  error?: string
}

type CreateRoomModalProps = {
  onClose: () => void
}

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [visible, setVisible] = useState(true)
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          description,
          visible,
          ...(!visible ? { password } : {}),
        }),
      })
      const result = (await response.json()) as CreateRoomResponse

      if (!response.ok || !result.chat) {
        throw new Error(result.error ?? 'Não foi possível criar a sala.')
      }

      onClose()
      navigate(`/chat/${result.chat.id}`, {
        state: !visible ? { password } : undefined,
      })
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível conectar ao servidor. Tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="create-room-title" className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">Nova conversa</p>
            <h2 id="create-room-title" className="mt-2 text-2xl font-semibold">Criar sala</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white">×</button>
        </div>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label htmlFor="new-room-name" className="block text-sm font-medium text-slate-300">
            Nome da sala
            <input
              id="new-room-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(event) => setName(event.currentTarget.value)}
              placeholder="Ex.: Conversas sobre tecnologia"
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <label htmlFor="new-room-description" className="block text-sm font-medium text-slate-300">
            Descrição <span className="font-normal text-slate-500">(opcional)</span>
            <textarea
              id="new-room-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
              placeholder="Sobre o que é esta sala?"
              className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-300">Visibilidade da sala</legend>
            <div className="relative grid grid-cols-2 rounded-xl border border-slate-700 bg-slate-950 p-1">
              <span aria-hidden="true" className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%_-_4px)] rounded-lg bg-slate-800 shadow transition-transform duration-200 ${visible ? 'translate-x-0' : 'translate-x-full'}`} />
              <label className={`relative z-10 flex cursor-pointer items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition focus-within:ring-2 focus-within:ring-cyan-400/40 ${visible ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}>
                <input
                  type="radio"
                  name="room-visibility"
                  value="public"
                  checked={visible}
                  onChange={() => {
                    setVisible(true)
                    setPassword('')
                  }}
                  className="sr-only"
                />
                Pública
              </label>
              <label className={`relative z-10 flex cursor-pointer items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium transition focus-within:ring-2 focus-within:ring-cyan-400/40 ${!visible ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}>
                <input
                  type="radio"
                  name="room-visibility"
                  value="private"
                  checked={!visible}
                  onChange={() => setVisible(false)}
                  className="sr-only"
                />
                Privada
              </label>
            </div>
          </fieldset>

          {!visible && (
            <label htmlFor="new-room-password" className="block text-sm font-medium text-slate-300">
              Senha da sala
              <input
                id="new-room-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                placeholder="Defina uma senha"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
              />
            </label>
          )}

          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Criando...' : 'Criar sala'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
