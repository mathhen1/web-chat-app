import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { updateProfile, type PublicUser } from '../services/user.service'

type ProfileEditModalProps = {
  user: PublicUser
  onClose: () => void
  onUpdated: (user: PublicUser) => void
}

const supportedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
])

export default function ProfileEditModal({
  user,
  onClose,
  onUpdated,
}: ProfileEditModalProps) {
  const [username, setUsername] = useState(user.username)
  const [status, setStatus] = useState(user.status)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const previewUrlRef = useRef<string | null>(null)
  const hasChanges =
    username.trim().toLowerCase() !== user.username ||
    status !== user.status ||
    photoFile !== null

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedPhoto = event.currentTarget.files?.[0] ?? null
    setError('')

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    if (selectedPhoto && !supportedImageTypes.has(selectedPhoto.type)) {
      setPhotoFile(null)
      setPhotoPreviewUrl('')
      setError('Escolha um arquivo de imagem válido.')
      return
    }

    if (selectedPhoto && selectedPhoto.size > 5 * 1024 * 1024) {
      setPhotoFile(null)
      setPhotoPreviewUrl('')
      setError('A imagem deve ter no máximo 5 MB.')
      return
    }

    setPhotoFile(selectedPhoto)
    previewUrlRef.current = selectedPhoto ? URL.createObjectURL(selectedPhoto) : null
    setPhotoPreviewUrl(previewUrlRef.current ?? '')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!hasChanges) return

    const changes = {
      ...(username.trim().toLowerCase() !== user.username && { username: username.trim() }),
      ...(status !== user.status && { status }),
      ...(photoFile && { photo: photoFile }),
    }

    setIsSaving(true)
    setError('')

    try {
      const updatedUser = await updateProfile(user.username, changes)
      onUpdated(updatedUser)
    } catch (reason: unknown) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível atualizar seu perfil.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-slate-950/80 px-4 py-8 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-edit-title"
        className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl shadow-black/50 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-cyan-300">
              Seu perfil
            </p>
            <h2 id="profile-edit-title" className="mt-2 text-2xl font-semibold">
              Editar perfil
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Fechar"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="flex items-center gap-5">
            <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-slate-700 bg-slate-950">
              {photoPreviewUrl || user.profilePhoto ? (
                <img
                  src={photoPreviewUrl || user.profilePhoto || undefined}
                  alt={`Foto de perfil de ${user.username}`}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="size-10 text-slate-500"
                >
                  <circle cx="12" cy="8" r="3.5" />
                  <path strokeLinecap="round" d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                </svg>
              )}
            </div>

            <div>
              <label
                htmlFor="profile-photo"
                className="inline-flex cursor-pointer rounded-lg border border-cyan-400/60 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400 hover:text-slate-950"
              >
                Escolher imagem
              </label>
              <input
                id="profile-photo"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handlePhotoChange}
                disabled={isSaving}
                className="sr-only"
              />
              <p className="mt-2 text-xs text-slate-500">
                JPEG, PNG, GIF ou WebP. Máximo de 5 MB.
              </p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-300">
            Nome de usuário
            <input
              type="text"
              required
              value={username}
              onChange={(event) => setUsername(event.currentTarget.value)}
              disabled={isSaving}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 disabled:opacity-50"
            />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Status
            <textarea
              rows={3}
              maxLength={280}
              value={status}
              onChange={(event) => setStatus(event.currentTarget.value)}
              disabled={isSaving}
              className="mt-2 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400 disabled:opacity-50"
            />
            <span className="mt-2 block text-right text-xs text-slate-500">
              {status.length}/280
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
