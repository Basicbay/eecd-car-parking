import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

interface ApiSession {
  accessToken?: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const getUsersUrl = (searchParams?: URLSearchParams) => {
  const apiBaseUrl = trimTrailingSlash(
    process.env.AUTH_API_BASE_URL ?? "http://localhost:3000/api",
  )
  const query = searchParams?.toString()

  return `${apiBaseUrl}/users${query ? `?${query}` : ""}`
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

export async function GET(request: NextRequest) {
  const headers = await getAuthHeaders(request)

  if (!headers) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const response = await fetch(getUsersUrl(request.nextUrl.searchParams), {
    headers,
    cache: "no-store",
  })

  return proxyJsonResponse(response)
}

export async function POST(request: NextRequest) {
  const headers = await getAuthHeaders(request)

  if (!headers) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const response = await fetch(getUsersUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  })

  return proxyJsonResponse(response)
}
