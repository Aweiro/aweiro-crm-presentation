export const fetcher = async (url: string) => {
  const res = await fetch(url)
  const json = await res.json()

  if (!res.ok) {
    throw json
  }

  return json
}