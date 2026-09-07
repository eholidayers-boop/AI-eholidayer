import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { InventoryClient } from '@/lib/inventory/client';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const client = new InventoryClient(
          process.env.LEGACY_API_BASE_URL!,
          process.env.LEGACY_API_TOKEN!
        );
        try {
          const { user, token } = await client.login(String(creds.email), String(creds.password));
          return { id: user.id, email: user.email, name: user.email, role: user.role, apiToken: token } as any;
        } catch {
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) (token as any).apiToken = (user as any).apiToken;
      return token;
    },
    async session({ session, token }) {
      (session as any).apiToken = (token as any).apiToken;
      return session;
    }
  },
  pages: { signIn: '/login' }
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
