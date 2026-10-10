import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const publicRooms = [
  { id: 'web-development', name: 'Desenvolvimento Web', description: 'Ideias, ferramentas e projetos para a web.', members: 128 },
  { id: 'general', name: 'Papo geral', description: 'Um lugar para conversar sobre qualquer assunto.', members: 86 },
  { id: 'design', name: 'Design & Criatividade', description: 'Compartilhe referências e trabalhos em andamento.', members: 54 },
]

export default function Chats() {
  const { user } = useAuth()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/home" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-lg text-slate-950">w</span>
            WebChat
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/chats" className="text-cyan-300">Salas públicas</Link>
            <Link to={`/${user?.username ?? ''}`} className="text-slate-300 transition hover:text-white">Meu perfil</Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-300">Encontre sua conversa</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Salas públicas</h1>
        <p className="mt-4 max-w-2xl text-slate-400">Explore as conversas abertas e entre em uma sala que combine com você.</p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {publicRooms.map((room) => (
            <article key={room.id} className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <div className="mb-5 grid size-12 place-items-center rounded-xl bg-cyan-400/10 text-xl text-cyan-300">#</div>
              <h2 className="text-xl font-semibold">{room.name}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{room.description}</p>
              <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-xs text-slate-500">{room.members} participantes</span>
                <Link to={`/chat/${room.id}`} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Entrar na sala</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
