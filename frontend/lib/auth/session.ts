const BACKEND_TOKEN_KEY = "cosmolens_backend_token"
const USER_KEY = "cosmolens_user"


export type SessionUser = {
  uid: string
  email?: string | null
  display_name?: string | null
  provider?: string | null
}


type SessionPayload = {
  user: SessionUser
  access_token: string
  token_type: string
  expires_in: number
}


export function saveSession(payload: SessionPayload) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(BACKEND_TOKEN_KEY, payload.access_token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
}


export function clearSession() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(BACKEND_TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
}


export function getStoredAccessToken() {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(BACKEND_TOKEN_KEY)
}


export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}
