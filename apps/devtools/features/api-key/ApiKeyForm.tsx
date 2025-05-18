
// ApiKeyForm.tsx
'use client'

import { useState } from 'react'

export default function ApiKeyForm() {
  const [userId, setUserId] = useState('')
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState('read,write')
  const [expiration, setExpiration] = useState('')
  const [result, setResult] = useState(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name,
        scopes: scopes.split(','),
        expiration,
      }),
    })
    const data = await res.json()
    setResult(data)
  }

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-semibold">Create API Key</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-2 border rounded"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Key Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Scopes (comma-separated)"
          value={scopes}
          onChange={(e) => setScopes(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Expiration (ISO format)"
          value={expiration}
          onChange={(e) => setExpiration(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-black text-white rounded">
          Generate Key
        </button>
      </form>
      {result && (
        <pre className="mt-4 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
