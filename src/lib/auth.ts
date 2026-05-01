import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { db } from "./db";
import { user, session, account, verification, invitation as invitationTable } from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { 
      user, 
      session, 
      account, 
      verification,
      invitation: invitationTable 
    },
  }),

  // Email + password login only (internal tool — no OAuth needed)
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // RBAC and Onboarding
  plugins: [
    admin({
      defaultRole: "management",
      adminRole: ["founder", "core_admin"],
    }),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,      // Refresh if >1 day old
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min client-side cache
    },
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "https://hr.igac.info",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
