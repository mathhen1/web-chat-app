import { useEffect } from 'react'

type ToastProps = {
  message: string
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, 4500)
    return () => window.clearTimeout(timeoutId)
  }, [message, onClose])

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-rose-400/30 bg-slate-900 px-4 py-3.5 text-sm text-slate-200 shadow-2xl shadow-black/40" role="alert" aria-live="assertive">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rose-400/15 font-semibold text-rose-300">!</span>
      <p className="flex-1 leading-6">{message}</p>
      <button type="button" onClick={onClose} aria-label="Fechar aviso" className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-slate-500 transition hover:bg-slate-800 hover:text-white">×</button>
    </div>
  )
}
