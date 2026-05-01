import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Security check: Only allow elevation if there is EXACTLY 1 user in the DB (the one just created)
    const usersCount = await db.select({ count: count() }).from(user);
    if (usersCount[0].count > 1) {
      return NextResponse.json({ error: "Setup is already complete" }, { status: 403 });
    }

    await db.update(user).set({ role: "core_admin" }).where(eq(user.email, email));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
