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

const getRolesUrl = (id: string) => {
  const apiBaseUrl = trimTrailingSlash(
    process.env.AUTH_API_BASE_URL ?? "http://localhost:3000/api",
  )

  return `${apiBaseUrl}/users/${id}/roles`
}

const getClientIpAddress = (request: NextRequest) => {
  return (
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = (await auth()) as ApiSession | null

  if (!session?.accessToken) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const { id } = await context.params
  const response = await fetch(getRolesUrl(id), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      "x-forwarded-for": getClientIpAddress(request),
    },
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  })
  const payload = await response.json().catch(() => ({}))

  return NextResponse.json(payload, {
    status: response.status,
  })
}
