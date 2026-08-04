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

const getRolePermissionsUrl = (id: string) => {
  const apiBaseUrl = trimTrailingSlash(
    process.env.NEXT_PUBLIC_API ?? "http://localhost:3000/api",
  )

  return `${apiBaseUrl}/roles/${id}/permissions`
}

const getClientIpAddress = (request: NextRequest) => {
  return (
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

const getAuthHeaders = async (request: NextRequest) => {
  const session = (await auth()) as ApiSession | null

  if (!session?.accessToken) {
    return null
  }

  return {
    Authorization: `Bearer ${session.accessToken}`,
    "Content-Type": "application/json",
    "x-forwarded-for": getClientIpAddress(request),
  }
}

const proxyJsonResponse = async (response: Response) => {
  const payload = await response.json().catch(() => ({}))

  return NextResponse.json(payload, {
    status: response.status,
  })
}

export async function GET(request: NextRequest, context: RouteContext) {
  const headers = await getAuthHeaders(request)

  if (!headers) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const { id } = await context.params
  const response = await fetch(getRolePermissionsUrl(id), {
    headers,
    cache: "no-store",
  })

  return proxyJsonResponse(response)
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const headers = await getAuthHeaders(request)

  if (!headers) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const { id } = await context.params
  const response = await fetch(getRolePermissionsUrl(id), {
    method: "PUT",
    headers,
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  })

  return proxyJsonResponse(response)
}
