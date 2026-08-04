import { auth } from "@/auth"
import { NextResponse } from "next/server"

interface ApiSession {
  accessToken?: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const getRolesUrl = () => {
  const apiBaseUrl = trimTrailingSlash(
    process.env.NEXT_PUBLIC_API ?? "http://localhost:3000/api",
  )

  return `${apiBaseUrl}/roles`
}

export async function GET() {
  const session = (await auth()) as ApiSession | null

  if (!session?.accessToken) {
    return NextResponse.json(
      { success: false, message: "Unauthorized", data: {}, metadata: {} },
      { status: 401 },
    )
  }

  const response = await fetch(getRolesUrl(), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
  const payload = await response.json().catch(() => ({}))

  return NextResponse.json(payload, {
    status: response.status,
  })
}
