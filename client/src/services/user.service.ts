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

export async function uploadProfilePhoto(
  username: string,
  photo: File,
): Promise<PublicUser> {
  const formData = new FormData()
  formData.set('photo', photo)

  const response = await fetch(
    `/api/users/${encodeURIComponent(username)}/photo/upload`,
    {
      method: 'POST',
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
