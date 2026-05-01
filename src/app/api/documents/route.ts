import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberDocuments } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, sql } from "drizzle-orm";

// GET /api/documents?memberId=xxx
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  const rows = await db.query.memberDocuments.findMany({
    where: memberId ? eq(memberDocuments.memberId, memberId) : undefined,
    orderBy: [desc(memberDocuments.uploadedAt)],
  });

  return NextResponse.json({ data: rows });
}

// POST /api/documents — add a document record
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { memberId, documentType, name, url } = body;

  if (!memberId || !documentType || !name || !url) {
    return NextResponse.json({ error: "memberId, documentType, name, and url are required" }, { status: 400 });
  }

  const record = await db
    .insert(memberDocuments)
    .values({ memberId, documentType, name, url })
    .returning();

  return NextResponse.json({ data: record[0] }, { status: 201 });
}
