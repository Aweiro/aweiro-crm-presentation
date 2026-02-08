export async function login(login: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password }),
  })

  if (!res.ok) {
    throw new Error('Unauthorized')
  }

  return await res.json() as {
    ok: true
    role: 'ADMIN' | 'USER'
  }
}

export async function logout() {
	await fetch('/api/auth/logout', {
		method: 'POST',
	})
}