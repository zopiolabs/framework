
// ApiKeyList.tsx
'use client'

import { useEffect, useState } from 'react'

export default function ApiKeyList() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setLoading(true)
    const res = await fetch('/api/api-key')
    const data = await res.json()
    setKeys(data)
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    // Optimistic update
    setKeys((prev) => prev.filter((key) => key.id !== id))

    const res = await fetch(`/api/api-key?id=${id}`, {
      method: 'DELETE',
    })

    if (!res.ok) {
      // Revert if failed
      await fetchKeys()
    }

    setDeleting(null)
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-lg font-semibold">API Keys</h2>
      {keys.length === 0 && <p>No keys found.</p>}
      <ul className="space-y-2">
        {keys.map((key) => (
          <li key={key.id} className="flex items-center justify-between border p-2 rounded">
            <div>
              <p className="text-sm font-medium">{key.name}</p>
              <p className="text-xs text-gray-500">ID: {key.id}</p>
            </div>
            <button
              className="text-red-500 text-sm disabled:opacity-50"
              onClick={() => handleDelete(key.id)}
              disabled={deleting === key.id}
            >
              {deleting === key.id ? 'Deleting...' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
