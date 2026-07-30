import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth/next"

interface ApiEnvelope<TData> {
  success?: boolean
  message?: string
  data?: TData
}

interface AuthTokenData {
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  user?: AuthProfile
}

interface AuthProfile {
  id?: string
  email?: string
  fullName?: string
  name?: string
  permissions?: string[]
  roles?: string[]
  sessionId?: string
}

interface JwtPayload {
  sub?: string
  email?: string
  fullName?: string
  permissions?: string[]
  roles?: string[]
  sessionId?: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "")

const getLoginUrl = () => {
  if (process.env.AUTH_LOGIN_URL) {
    return process.env.AUTH_LOGIN_URL
  }

  const apiBaseUrl = trimTrailingSlash(
    process.env.AUTH_API_BASE_URL ?? "http://localhost:3000/api",
  )

  return `${apiBaseUrl}/auth/login`
}

const getProfileUrl = () => {
  if (process.env.AUTH_PROFILE_URL) {
    return process.env.AUTH_PROFILE_URL
  }

  const apiBaseUrl = trimTrailingSlash(
    process.env.AUTH_API_BASE_URL ?? "http://localhost:3000/api",
  )

  return `${apiBaseUrl}/auth/profile`
}

const unwrapApiData = <TData>(payload: unknown): TData | null => {
  if (typeof payload !== "object" || payload === null) {
    return null
  }

  if ("data" in payload) {
    return (payload as ApiEnvelope<TData>).data ?? null
  }

  return payload as TData
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
  const [, payload] = token.split(".")

  if (!payload) {
    return null
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    )

    return JSON.parse(Buffer.from(paddedPayload, "base64").toString("utf8"))
  } catch {
    return null
  }
}

const fetchProfile = async (accessToken: string): Promise<AuthProfile | null> => {
  try {
    const response = await fetch(getProfileUrl(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json()
    return unwrapApiData<AuthProfile>(payload)
  } catch {
    return null
  }
}

const getRoleFromAuthData = (
  roles: string[] | undefined,
  permissions: string[] | undefined,
) => {
  if (roles?.includes("SUPER_ADMIN")) return "SUPER_ADMIN"
  if (roles?.includes("ADMIN")) return "ADMIN"
  if (roles?.includes("MANAGER")) return "MANAGER"

  return permissions?.includes("*") ? "SUPER_ADMIN" : "USER"
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const response = await fetch(getLoginUrl(), {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
          cache: "no-store",
        })

        if (!response.ok) {
          return null
        }

        const payload = await response.json()
        const tokenData = unwrapApiData<AuthTokenData>(payload)

        if (!tokenData?.accessToken) {
          return null
        }

        const decodedToken = decodeJwtPayload(tokenData.accessToken)
        const profile = tokenData.user ?? (await fetchProfile(tokenData.accessToken))
        const permissions = profile?.permissions ?? decodedToken?.permissions ?? []
        const roles = profile?.roles ?? decodedToken?.roles ?? []
        const email = profile?.email ?? decodedToken?.email ?? credentials.email
        const fullName =
          profile?.fullName ?? decodedToken?.fullName ?? profile?.name ?? email

        return {
          id: profile?.id ?? decodedToken?.sub ?? email,
          name: fullName,
          fullName,
          email,
          role: getRoleFromAuthData(roles, permissions),
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          accessTokenExpires: tokenData.expiresIn
            ? Date.now() + tokenData.expiresIn * 1000
            : undefined,
          permissions,
          roles,
          sessionId: profile?.sessionId ?? decodedToken?.sessionId,
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || "eecd-car-park-secret-key-12345-smooth-yellow-secret-key-998877",
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const authUser = user as any
        token.role = authUser.role
        token.accessToken = authUser.accessToken
        token.refreshToken = authUser.refreshToken
        token.accessTokenExpires = authUser.accessTokenExpires
        token.permissions = authUser.permissions
        token.roles = authUser.roles
        token.sessionId = authUser.sessionId
        token.fullName = authUser.fullName ?? authUser.name
        token.name = authUser.fullName ?? authUser.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionUser = session.user as any
        sessionUser.id = token.sub
        sessionUser.role = token.role as string
        sessionUser.permissions = token.permissions as string[] | undefined
        sessionUser.roles = token.roles as string[] | undefined
        sessionUser.sessionId = token.sessionId as string | undefined
        sessionUser.fullName = token.fullName as string | undefined
        session.user.name =
          (token.fullName as string | undefined) ?? session.user.name
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session as any).accessToken = token.accessToken
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session as any).refreshToken = token.refreshToken
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(session as any).accessTokenExpires = token.accessTokenExpires
      return session
    }
  }
}

export const auth = () => getServerSession(authOptions)
