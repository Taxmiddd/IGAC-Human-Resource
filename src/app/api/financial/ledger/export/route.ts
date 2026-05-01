import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { financialLedger } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session || session.user.role !== "core_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const memberId = searchParams.get("memberId");

  const conditions = [];
  if (memberId) conditions.push(eq(financialLedger.memberId, memberId));
  if (type) conditions.push(eq(financialLedger.transactionType, type as any));
  const where = conditions.length ? and(...conditions) : undefined;

  const rows = await db.query.financialLedger.findMany({
    where,
    with: { member: { columns: { fullName: true, employeeId: true } } },
    orderBy: [desc(financialLedger.recordedAt)],
  });

  const csvData = rows.map(r => ({
    "Date": new Date(r.recordedAt ?? Date.now()).toISOString().split("T")[0],
    "Member Name": r.member?.fullName ?? "Unknown",
    "Member ID": r.member?.employeeId ?? "",
    "Transaction Type": r.transactionType,
    "Purpose": r.purpose,
    "Event": r.eventName ?? "",
    "Allotted (BDT)": (r.allotted / 100).toFixed(2),
    "Disbursed (BDT)": (r.disbursed / 100).toFixed(2),
    "Balance (BDT)": ((r.allotted - r.disbursed) / 100).toFixed(2),
  }));

  const csv = Papa.unparse(csvData);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="igac_financial_ledger.csv"',
    },
  });
}
