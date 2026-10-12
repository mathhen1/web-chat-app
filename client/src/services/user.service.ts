export type PublicUser = {
  id: string
  username: string
  status: string
  profilePhoto: string | null
}

type PublicUserResponse = { user?: PublicUser; error?: string }

export class UserApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'UserApiError'
  }
}

export async function getPublicUser(username: string): Promise<PublicUser> {
  const response = await fetch(
    `/api/users/${encodeURIComponent(username)}`,
    { credentials: 'include' },
  )
  const result = (await response.json()) as PublicUserResponse

  if (!response.ok || !result.user) {
    throw new UserApiError(
      result.error ?? 'Não foi possível carregar este perfil.',
      response.status,
    )
  }

  return result.user
}

export type ProfileUpdate = {
  username?: string
  status?: string
  photo?: File
}

export async function updateProfile(
  username: string,
  changes: ProfileUpdate,
): Promise<PublicUser> {
  const formData = new FormData()
  if (changes.username !== undefined) formData.set('username', changes.username)
  if (changes.status !== undefined) formData.set('status', changes.status)
  if (changes.photo) formData.set('photo', changes.photo)

  const response = await fetch(
    `/api/users/${encodeURIComponent(username)}/edit`,
    {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    },
  )
  const result = (await response.json()) as PublicUserResponse & { error?: string }

  if (!response.ok || !result.user) {
    throw new UserApiError(
      result.error ?? 'Não foi possível atualizar sua foto de perfil.',
      response.status,
    )
  }

  return result.user
}
