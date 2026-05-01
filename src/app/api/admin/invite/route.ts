import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invitation } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  
  // Only founder can invite
  if (!session || (session.user.role !== "founder" && session.user.role !== "core_admin")) {
    // Actually, based on previous prompt, only founder. 
    // But maybe core_admin should too? The user said "only with my account".
    if (session?.user?.role !== "founder") {
      return NextResponse.json({ error: "Forbidden — Only Founder can invite" }, { status: 403 });
    }
  }

  const { email, role } = await req.json();

  if (!email || !role) {
    return NextResponse.json({ error: "Missing email or role" }, { status: 400 });
  }

  // Create a custom invitation
  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  try {
    await db.insert(invitation).values({
      id,
      email,
      role: role as any,
      inviterId: session!.user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error("Failed to create invitation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
