import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens, credits } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getGeoInfo } from "@/lib/utils/geo";
import { createUserCredits } from "@/lib/db/queries";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
    async signIn({ user }) {
      if (user.id) {
        try {
          // Get user's IP and country
          const { ip, country } = await getGeoInfo();

          // Check if user already has a credits account
          const [existingCredits] = await db
            .select()
            .from(credits)
            .where(eq(credits.userId, user.id))
            .limit(1);

          if (!existingCredits) {
            // New user: Create credits account with free plan
            await createUserCredits(user.id, 'free');

            // Update user with signup tracking info
            await db.update(users).set({
              signupIp: ip,
              signupCountry: country,
              lastLoginAt: new Date(),
              lastLoginIp: ip,
              lastLoginCountry: country,
            }).where(eq(users.id, user.id));
          } else {
            // Existing user: Only update login info
            await db.update(users).set({
              lastLoginAt: new Date(),
              lastLoginIp: ip,
              lastLoginCountry: country,
            }).where(eq(users.id, user.id));
          }
        } catch (error) {
          // Geo lookup or credits creation failed — log but don't block sign-in
          console.error('SignIn callback error (non-blocking):', error);

          // Ensure user has at least a credits account
          try {
            const [existingCredits] = await db
              .select()
              .from(credits)
              .where(eq(credits.userId, user.id))
              .limit(1);

            if (!existingCredits) {
              await createUserCredits(user.id, 'free');
            }
          } catch (innerError) {
            console.error('Critical: Failed to create credits for user:', innerError);
          }
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth-error',
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
