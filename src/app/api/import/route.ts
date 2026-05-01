import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { members, departments } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { generateEmployeeId } from "@/lib/utils";
import { sql } from "drizzle-orm";

// POST /api/import — CSV spreadsheet bulk import (core_admin only)
// Accepts JSON array parsed from CSV on the client
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows }: { rows: Record<string, string>[] } = await req.json();
  if (!rows?.length) return NextResponse.json({ error: "No rows provided" }, { status: 400 });

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(members);
  let currentCount = countResult[0].count;

  const inserted = [];
  const errors = [];

  for (const [index, row] of rows.entries()) {
    try {
      // Map spreadsheet columns → schema fields
      const memberData = {
        employeeId: row["employee_id"] || generateEmployeeId(currentCount),
        fullName: row["full_name"] || row["name"] || "",
        email: row["email"] || "",
        phone: row["phone"] ?? null,
        igacRole: (row["igac_role"] || "associate") as any,
        memberStatus: (row["member_status"] || "active") as any,
        activeness: (row["activeness"] || "active") as any,
        responsiveness: (row["responsiveness"] || "responsive") as any,
        fatherName: row["father_name"] ?? null,
        fatherPhone: row["father_phone"] ?? null,
        motherName: row["mother_name"] ?? null,
        motherPhone: row["mother_phone"] ?? null,
        facebookUrl: row["facebook_url"] ?? null,
        instagramUrl: row["instagram_url"] ?? null,
        linkedinUrl: row["linkedin_url"] ?? null,
        twitterUrl: row["twitter_url"] ?? null,
        address: row["address"] ?? null,
        city: row["city"] ?? null,
        notes: row["notes"] ?? null,
        createdBy: session.user.id,
      };

      if (!memberData.fullName || !memberData.email) {
        errors.push({ row: index + 1, error: "full_name and email are required" });
        continue;
      }

      const result = await db.insert(members).values(memberData).returning({ id: members.id });
      inserted.push(result[0].id);
      currentCount++;
    } catch (err: any) {
      errors.push({ row: index + 1, error: err.message });
    }
  }

  return NextResponse.json({
    inserted: inserted.length,
    errors,
    success: errors.length === 0,
  });
}
