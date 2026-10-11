type CreateRoomModalProps = {
  onClose: () => void
}

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
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
        <p className="mt-6 rounded-xl border border-dashed border-slate-700 px-5 py-8 text-center text-sm text-slate-400">
          As opções da nova sala serão configuradas aqui.
        </p>
      </section>
    </div>
  )
}
