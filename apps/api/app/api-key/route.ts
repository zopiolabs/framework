
// apps/api/app/api-key/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApiKeyController, deleteApiKeyController, listApiKeysController } from './controller'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = await createApiKeyController(body)
  return NextResponse.json(result)
}

export async function GET() {
  const result = await listApiKeysController()
  return NextResponse.json(result)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }
  const result = await deleteApiKeyController(id)
  return NextResponse.json(result)
}
