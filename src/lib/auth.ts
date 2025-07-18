import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./db"
import bcrypt from "bcryptjs"
import { User } from "@/types"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          // Log failed login attempt - user not found
          try {
            const { auditService } = await import('./audit')
            await auditService.log({
              action: 'LOGIN_FAILED',
              entityType: 'AUTH',
              entityId: 'unknown',
              entityName: credentials.email,
              description: `Tentativa de login falhada - utilizador não encontrado`,
              metadata: {
                email: credentials.email,
                reason: 'user_not_found',
                attemptTime: new Date().toISOString()
              }
            })
          } catch (error) {
            console.error('Failed to log failed login attempt:', error)
          }
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          // Log failed login attempt - wrong password
          try {
            const { auditService } = await import('./audit')
            await auditService.log({
              action: 'LOGIN_FAILED',
              entityType: 'AUTH',
              entityId: user.id,
              entityName: user.name || user.email,
              description: `Tentativa de login falhada - palavra-passe incorreta`,
              metadata: {
                email: credentials.email,
                reason: 'wrong_password',
                attemptTime: new Date().toISOString()
              }
            })
          } catch (error) {
            console.error('Failed to log failed login attempt:', error)
          }
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar || undefined,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.avatar = user.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as any
        session.user.avatar = token.avatar as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Log successful login
      try {
        const { auditService } = await import('./audit')
        await auditService.log({
          action: 'LOGIN',
          entityType: 'AUTH',
          entityId: user.id || 'unknown',
          entityName: user.name || user.email || 'Utilizador',
          description: `Login realizado com sucesso`,
          metadata: {
            provider: account?.provider,
            loginTime: new Date().toISOString(),
            userAgent: 'unknown' // Will be captured by middleware
          }
        })
      } catch (error) {
        console.error('Failed to log login event:', error)
      }
      return true
    }
  },
  events: {
    async signOut({ session, token }) {
      // Log logout
      try {
        const { auditService } = await import('./audit')
        await auditService.log({
          action: 'LOGOUT',
          entityType: 'AUTH',
          entityId: session?.user?.id || token?.sub || 'unknown',
          entityName: session?.user?.name || session?.user?.email || 'Utilizador',
          description: `Logout realizado`,
          metadata: {
            logoutTime: new Date().toISOString(),
            sessionDuration: 'unknown' // Could calculate if we stored login time
          }
        })
      } catch (error) {
        console.error('Failed to log logout event:', error)
      }
    },
    async session({ session, token }) {
      // Log session access (optional - might be too verbose)
      // Could be used to track active sessions
    }
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
