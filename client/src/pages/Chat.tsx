import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const sampleMessages = [
  { author: 'marina', time: '14:32', text: 'Oi, pessoal! Alguém já experimentou essa ferramenta?' },
  { author: 'caio', time: '14:34', text: 'Estou testando hoje. A interface está bem legal.' },
  { author: 'marina', time: '14:36', text: 'Depois compartilha o que achou por aqui :)' },
]

export default function Chat() {
  const { id_sala: roomId } = useParams<{ id_sala: string }>()
  const { user } = useAuth()

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
            WebChat
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/chats" className="text-slate-300 transition hover:text-white">Todas as salas</Link>
            <Link to={`/${user?.username ?? ''}`} className="text-slate-300 transition hover:text-white">Meu perfil</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <Link to="/chats" aria-label="Voltar para salas públicas" className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300">←</Link>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">Sala pública</p>
            <h1 className="mt-1 truncate text-lg font-semibold">{roomId?.replaceAll('-', ' ')}</h1>
          </div>
          <span className="hidden rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300 sm:inline-flex">12 online</span>
        </div>

        <div className="flex flex-1 flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-7">
          <div className="mb-2 text-center text-xs text-slate-500">Hoje · início da conversa</div>
          {sampleMessages.map((message) => (
            <article key={`${message.author}-${message.time}`} className="flex gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-800 text-sm font-semibold text-cyan-300">
                {message.author[0].toUpperCase()}
              </span>
              <div>
                <div className="flex items-baseline gap-2">
                  <Link to={`/${message.author}`} className="text-sm font-medium text-slate-200 transition hover:text-cyan-300">{message.author}</Link>
                  <time className="text-xs text-slate-500">{message.time}</time>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-400">{message.text}</p>
              </div>
            </article>
          ))}
          <div className="mt-auto rounded-xl border border-dashed border-slate-700 px-4 py-3 text-center text-xs text-slate-500">
            Protótipo visual · mensagens ainda não são enviadas
          </div>
        </div>
      </section>
    </main>
  )
}
