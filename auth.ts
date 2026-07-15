import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getServerSession } from "next-auth/next"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.username === "admin" && credentials?.password === "admin1234") {
          return { id: "1", name: "Admin", email: "admin@carpark.com", role: "admin" }
        }
        return null
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
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role as string
      }
      return session
    }
  }
}

export const auth = () => getServerSession(authOptions)
