import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

interface ApiSession {
  accessToken?: string
}

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const getPermissionUrl = (id: string) => {
  const apiBaseUrl = trimTrailingSlash(
    process.env.AUTH_API_BASE_URL ?? "http://localhost:3000/api",
  )

  return `${apiBaseUrl}/permissions/${id}`
}

const getAuthHeaders = async () => {
  const session = (await auth()) as ApiSession | null

  if (!session?.accessToken) {
    return null
  }

  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
  }
}

const proxyJsonResponse = async (response: Response) => {
  const payload = await response.json().catch(() => ({}))

  return NextResponse.json(payload, {
    status: response.status,
  })
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const headers = await getAuthHeaders()

  if (!headers) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const { id } = await context.params
  const response = await fetch(getPermissionUrl(id), {
    headers,
    cache: "no-store",
  })

  return proxyJsonResponse(response)
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const headers = await getAuthHeaders()

  if (!headers) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const { id } = await context.params
  const response = await fetch(getPermissionUrl(id), {
    method: "PATCH",
    headers,
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  })

  return proxyJsonResponse(response)
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const headers = await getAuthHeaders()

  if (!headers) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const { id } = await context.params
  const response = await fetch(getPermissionUrl(id), {
    method: "DELETE",
    headers,
    cache: "no-store",
  })

  return proxyJsonResponse(response)
}
