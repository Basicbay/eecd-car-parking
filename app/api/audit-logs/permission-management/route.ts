import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

interface ApiSession {
  accessToken?: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const getPermissionAuditLogsUrl = (searchParams?: URLSearchParams) => {
  const apiBaseUrl = trimTrailingSlash(
    process.env.AUTH_API_BASE_URL ?? "http://localhost:3000/api",
  )
  const query = searchParams?.toString()

  return `${apiBaseUrl}/audit-logs/permission-management${
    query ? `?${query}` : ""
  }`
}

export async function GET(request: NextRequest) {
  const session = (await auth()) as ApiSession | null

  if (!session?.accessToken) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const response = await fetch(
    getPermissionAuditLogsUrl(request.nextUrl.searchParams),
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  )
  const payload = await response.json().catch(() => ({}))

  return NextResponse.json(payload, {
    status: response.status,
  })
}
