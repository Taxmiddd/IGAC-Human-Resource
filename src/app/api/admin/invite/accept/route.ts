import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invitation, user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { id, name, password } = await req.json();

  if (!id || !name || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // 1. Verify invitation
  const invite = await db.query.invitation.findFirst({
    where: eq(invitation.id, id),
  });

  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
  }

  // 2. Create user via Better Auth
  // We use signUpEmail, but we might need to set the role afterwards.
  try {
    const res = await auth.api.signUpEmail({
      headers: req.headers,
      body: {
        email: invite.email,
        password,
        name,
      },
    });

    if (!res || !res.user) {
      return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }

    // 3. Set the pre-selected role
    await db.update(user)
      .set({ role: invite.role as any })
      .where(eq(user.id, res.user.id));

    // 4. Delete the invitation
    await db.delete(invitation).where(eq(invitation.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: error.message || "Failed to create account" }, { status: 500 });
  }
}
