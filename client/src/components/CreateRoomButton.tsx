import { useState } from 'react'
import CreateRoomModal from './CreateRoomModal'

export default function CreateRoomButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="whitespace-nowrap rounded-lg border border-cyan-400/60 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950 sm:px-4 sm:text-sm">
        Criar sala
      </button>
      {isOpen && <CreateRoomModal onClose={() => setIsOpen(false)} />}
    </>
  )
}
