import type { FormEvent } from 'react'

type PrivateRoomModalProps = {
  roomId: string
  password: string
  isSubmitting: boolean
  error: string
  onPasswordChange: (password: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function PrivateRoomModal({
  roomId,
  password,
  isSubmitting,
  error,
  onPasswordChange,
  onClose,
  onSubmit,
}: PrivateRoomModalProps) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="private-room-title" className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">Sala privada · #{roomId}</p>
            <h2 id="private-room-title" className="mt-2 text-2xl font-semibold">Digite a senha</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">Esta sala exige uma senha para liberar o acesso.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white">×</button>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-4">
          <label htmlFor="private-room-password" className="block text-sm font-medium text-slate-300">Senha da sala</label>
          <input
            id="private-room-password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            value={password}
            onChange={(event) => onPasswordChange(event.currentTarget.value)}
            placeholder="Digite a senha"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">
              {isSubmitting ? 'Verificando...' : 'Acessar sala'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
