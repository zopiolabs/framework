
// api.ts
export async function createApiKey(input: {
  userId: string
  name: string
  scopes: string[]
  expiration: string
}) {
  const res = await fetch('/api/api-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    throw new Error('Failed to create API key')
  }

  return res.json()
}
