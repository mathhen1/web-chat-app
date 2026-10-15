import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import {
  acceptFriendRequest,
  FriendApiError,
  getFriends,
  getPendingFriendRequests,
  removeFriend,
  refuseFriendRequest,
  sendFriendRequest,
  type FriendProfile,
} from '../services/friend.service'
import type { PublicUser } from '../services/user.service'
import { useAuth } from '../hooks/useAuth'

type FriendshipPanelProps = {
  profile: PublicUser
  isOwnProfile: boolean
}

export default function FriendshipPanel({ profile, isOwnProfile }: FriendshipPanelProps) {
  const { user } = useAuth()
  const [friends, setFriends] = useState<FriendProfile[]>([])
  const [requests, setRequests] = useState<FriendProfile[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)
  const [isLoadingRequests, setIsLoadingRequests] = useState(isOwnProfile)
  const [friendsError, setFriendsError] = useState('')
  const [requestsError, setRequestsError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notification, setNotification] = useState('')
  const [isSendingRequest, setIsSendingRequest] = useState(false)
  const [isRemovingFriend, setIsRemovingFriend] = useState(false)
  const [busyRequestUsername, setBusyRequestUsername] = useState('')
  const [hasSentRequest, setHasSentRequest] = useState(false)

  const loadFriends = useCallback(async (): Promise<void> => {
    try {
      setFriends(await getFriends(profile.username))
      setFriendsError('')
    } catch (reason: unknown) {
      setFriendsError(reason instanceof Error ? reason.message : 'Não foi possível carregar os amigos.')
    } finally {
      setIsLoadingFriends(false)
    }
  }, [profile.username])

  const loadRequests = useCallback(async (): Promise<void> => {
    if (!isOwnProfile) return

    try {
      setRequests(await getPendingFriendRequests(profile.username))
      setRequestsError('')
    } catch (reason: unknown) {
      setRequestsError(reason instanceof Error ? reason.message : 'Não foi possível carregar os pedidos.')
    } finally {
      setIsLoadingRequests(false)
    }
  }, [isOwnProfile, profile.username])

  useEffect(() => {
    let isCurrentRequest = true

    getFriends(profile.username)
      .then((loadedFriends) => {
        if (isCurrentRequest) {
          setFriends(loadedFriends)
          setFriendsError('')
        }
      })
      .catch((reason: unknown) => {
        if (isCurrentRequest) {
          setFriendsError(reason instanceof Error ? reason.message : 'Não foi possível carregar os amigos.')
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoadingFriends(false)
      })

    if (isOwnProfile) {
      getPendingFriendRequests(profile.username)
        .then((loadedRequests) => {
          if (isCurrentRequest) {
            setRequests(loadedRequests)
            setRequestsError('')
          }
        })
        .catch((reason: unknown) => {
          if (isCurrentRequest) {
            setRequestsError(reason instanceof Error ? reason.message : 'Não foi possível carregar os pedidos.')
          }
        })
        .finally(() => {
          if (isCurrentRequest) setIsLoadingRequests(false)
        })
    }

    return () => {
      isCurrentRequest = false
    }
  }, [isOwnProfile, profile.username])

  useEffect(() => {
    if (!isOwnProfile) return

    const socket = io({ path: '/socket.io', withCredentials: true })
    socket.on('friend:request', (event: { sender: { id: string; username: string } }) => {
      setNotification(`@${event.sender.username} enviou um pedido de amizade.`)
      void loadRequests()
    })

    return () => {
      socket.disconnect()
    }
  }, [isOwnProfile, loadRequests])

  const handleSendRequest = async (): Promise<void> => {
    setIsSendingRequest(true)
    setActionError('')

    try {
      await sendFriendRequest(profile.username)
      setHasSentRequest(true)
    } catch (reason: unknown) {
      setActionError(reason instanceof Error ? reason.message : 'Não foi possível enviar o pedido.')
    } finally {
      setIsSendingRequest(false)
    }
  }

  const handleRemoveFriend = async (): Promise<void> => {
    if (!user || !window.confirm(`Remover @${profile.username} da sua lista de amigos?`)) return

    setIsRemovingFriend(true)
    setActionError('')

    try {
      await removeFriend(profile.username)
      setFriends((currentFriends) =>
        currentFriends.filter((friend) => friend.id !== user.id),
      )
    } catch (reason: unknown) {
      setActionError(
        reason instanceof Error ? reason.message : 'Não foi possível remover a amizade.',
      )
    } finally {
      setIsRemovingFriend(false)
    }
  }

  const handleRequestDecision = async (
    request: FriendProfile,
    decision: 'accept' | 'refuse',
  ): Promise<void> => {
    setBusyRequestUsername(request.username)
    setRequestsError('')

    try {
      if (decision === 'accept') {
        await acceptFriendRequest(request.username)
        await loadFriends()
      } else {
        await refuseFriendRequest(request.username)
      }
      setRequests((currentRequests) =>
        currentRequests.filter((currentRequest) => currentRequest.id !== request.id),
      )
    } catch (reason: unknown) {
      setRequestsError(reason instanceof FriendApiError ? reason.message : 'Não foi possível atualizar o pedido.')
      await loadRequests()
    } finally {
      setBusyRequestUsername('')
    }
  }

  const isAlreadyFriend = Boolean(user && friends.some((friend) => friend.id === user.id))

  return (
    <section className="mt-10 border-t border-slate-800 pt-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Amigos</h2>
          <p className="mt-2 text-sm text-slate-500">
            {friends.length} {friends.length === 1 ? 'amigo' : 'amigos'}
          </p>
        </div>
        {!isOwnProfile && user && !isLoadingFriends && !friendsError && !isAlreadyFriend && (
          <button
            type="button"
            onClick={() => void handleSendRequest()}
            disabled={isSendingRequest || hasSentRequest}
            className="rounded-lg border border-cyan-400/60 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSendingRequest
              ? 'Enviando...'
              : hasSentRequest
                ? 'Pedido enviado'
                : 'Adicionar amigo'}
          </button>
        )}
        {!isOwnProfile && user && !isLoadingFriends && isAlreadyFriend && (
          <button
            type="button"
            onClick={() => void handleRemoveFriend()}
            disabled={isRemovingFriend}
            className="rounded-lg border border-rose-400/50 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRemovingFriend ? 'Removendo...' : 'Remover amigo'}
          </button>
        )}
      </div>

      {notification && isOwnProfile && (
        <p role="status" className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200">
          {notification}
        </p>
      )}
      {actionError && <p role="alert" className="mt-4 text-sm text-rose-300">{actionError}</p>}

      {isOwnProfile && (requests.length > 0 || isLoadingRequests || requestsError) && (
        <section className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
          <h3 className="font-semibold">Solicitações recebidas</h3>
          {isLoadingRequests && (
            <p className="mt-4 text-sm text-slate-400">Carregando solicitações...</p>
          )}
          {requestsError && <p role="alert" className="mt-4 text-sm text-rose-300">{requestsError}</p>}
          {requests.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-800">
              {requests.map((request) => (
                <li key={request.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <Link to={`/${request.username}`} className="flex min-w-0 items-center gap-3 hover:text-cyan-300">
                    <FriendAvatar friend={request} />
                    <span className="truncate font-medium">@{request.username}</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRequestDecision(request, 'accept')}
                      disabled={busyRequestUsername !== ''}
                      className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                    >
                      {busyRequestUsername === request.username ? 'Salvando...' : 'Aceitar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRequestDecision(request, 'refuse')}
                      disabled={busyRequestUsername !== ''}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-rose-400 hover:text-rose-300 disabled:opacity-50"
                    >
                      Recusar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="mt-7">
        <h3 className="font-semibold">
          Veja todos os amigos deste perfil
        </h3>
        {isLoadingFriends && <p className="mt-4 text-sm text-slate-400">Carregando amigos...</p>}
        {friendsError && <p role="alert" className="mt-4 text-sm text-rose-300">{friendsError}</p>}
        {!isLoadingFriends && !friendsError && friends.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-slate-800 px-5 py-8 text-center text-sm text-slate-500">
            Ainda não há amigos para exibir.
          </p>
        )}
        {friends.length > 0 && (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {friends.map((friend) => (
              <li key={friend.id}>
                <Link
                  to={`/${friend.username}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-cyan-400/50"
                >
                  <FriendAvatar friend={friend} />
                  <span className="truncate font-medium">@{friend.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

function FriendAvatar({ friend }: { friend: FriendProfile }) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-800 text-slate-500">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="size-5"
      >
        <circle cx="12" cy="8" r="3.5" />
        <path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </svg>
      {friend.profilePhoto && (
        <img
          src={friend.profilePhoto}
          alt=""
          aria-hidden="true"
          onError={(event) => {
            event.currentTarget.hidden = true
          }}
          className="absolute inset-0 size-full rounded-full object-cover"
        />
      )}
    </span>
  )
}
