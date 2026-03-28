const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:18010"


export async function syncBackendSession(idToken: string) {
  const response = await fetch(`${backendUrl}/api/auth/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id_token: idToken }),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.detail ?? "Backend session sync failed.")
  }

  return response.json()
}


export async function fetchCurrentUser(accessToken: string) {
  const response = await fetch(`${backendUrl}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.detail ?? "Failed to fetch current user.")
  }

  return response.json()
}
