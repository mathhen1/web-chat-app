export type PublicUser = {
  id: string
  username: string
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
