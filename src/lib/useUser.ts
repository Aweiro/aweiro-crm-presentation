import { useEffect, useState } from 'react'

type User = {
	id: number
	login: string
	name: string | null
	role: 'ADMIN' | 'USER'
}

export function useUser() {
	const [user, setUser] = useState<User | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let mounted = true

		fetch('/api/auth/me', {
			credentials: 'include',
			cache: 'no-store'
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (!mounted) return
				setUser(data?.user || null)
			})
			.catch((err) => {
				console.error('useUser fetch error', err)
				if (mounted) setUser(null)
			})
			.finally(() => {
				if (mounted) setLoading(false)
			})

		return () => {
			mounted = false
		}
	}, [])

	return { user, loading }
}
