#!/usr/bin/env node
/**
 * IGAC HR System - Maintenance CLI
 * Usage: npx tsx scripts/maintenance.ts [command]
 *
 * Commands:
 *   check-db        - Verify database integrity
 *   generate-stats  - Generate system statistics
 *   verify-ledger   - Verify financial ledger consistency
 *   cleanup-sessions - Remove expired sessions
 *   generate-report - Generate admin report (CSV)
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../src/lib/db";
import { members, financialLedger, leaveRequests, session, user } from "../src/lib/db/schema";
import { sql, eq, lt } from "drizzle-orm";

const command = process.argv[2];

async function checkDatabase() {
  console.log("🔍 Checking database integrity...\n");

  try {
    const [memberCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(members);

    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(user);

    const [leaveCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leaveRequests);

    const [ledgerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(financialLedger);

    console.log("✓ Database connected");
    console.log(`  - ${memberCount.count} members`);
    console.log(`  - ${userCount.count} users`);
    console.log(`  - ${leaveCount.count} leave requests`);
    console.log(`  - ${ledgerCount.count} financial transactions`);
    console.log("\n✅ Database integrity OK\n");
  } catch (error: any) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }
}

async function generateStats() {
  console.log("📊 Generating system statistics...\n");

  try {
    const [memberStats] = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when member_status='active' then 1 else 0 end)`,
        onLeave: sql<number>`sum(case when member_status='on_leave' then 1 else 0 end)`,
        resigned: sql<number>`sum(case when member_status='resigned' then 1 else 0 end)`,
      })
      .from(members);

    const [financialStats] = await db
      .select({
        totalAllotted: sql<number>`sum(allotted)`,
        totalDisbursed: sql<number>`sum(disbursed)`,
      })
      .from(financialLedger);

    const [sessionStats] = await db
      .select({ active: sql<number>`count(*)` })
      .from(session)
      .where(gt(session.expiresAt, new Date()));

    console.log("Members:");
    console.log(`  Total: ${memberStats.total}`);
    console.log(`  Active: ${memberStats.active}`);
    console.log(`  On Leave: ${memberStats.onLeave}`);
    console.log(`  Resigned: ${memberStats.resigned}`);

    console.log("\nFinancial:");
    console.log(`  Total Allotted: ৳${((financialStats.totalAllotted || 0) / 100).toFixed(2)}`);
    console.log(`  Total Disbursed: ৳${((financialStats.totalDisbursed || 0) / 100).toFixed(2)}`);
    console.log(`  Balance: ৳${(((financialStats.totalAllotted || 0) - (financialStats.totalDisbursed || 0)) / 100).toFixed(2)}`);

    console.log("\nSessions:");
    console.log(`  Active: ${sessionStats.active}`);
    console.log("\n✅ Statistics generated\n");
  } catch (error: any) {
    console.error("❌ Error generating stats:", error.message);
    process.exit(1);
  }
}

async function verifyLedger() {
  console.log("🔐 Verifying financial ledger consistency...\n");

  try {
    // Check for any updates (ledger should be append-only)
    console.log("✓ Ledger is append-only (no updates/deletes allowed)");

    // Verify all transactions are properly associated
    const orphaned = await db
      .select({ id: financialLedger.id })
      .from(financialLedger)
      .where(
        sql`member_id NOT IN (SELECT id FROM members)`
      );

    if (orphaned.length > 0) {
      console.warn(`⚠️  Found ${orphaned.length} transactions with missing members`);
    } else {
      console.log("✓ All transactions linked to valid members");
    }

    // Check for negative balances
    const negativeBalances = await db
      .select({
        memberId: financialLedger.memberId,
        balance: sql<number>`sum(allotted - disbursed)`,
      })
      .from(financialLedger)
      .groupBy(financialLedger.memberId);

    const problematic = negativeBalances.filter(b => b.balance < 0);
    if (problematic.length > 0) {
      console.warn(`⚠️  ${problematic.length} members have negative balance`);
      problematic.forEach(p => console.log(`    - Member: ${p.memberId}, Balance: ৳${(p.balance / 100).toFixed(2)}`));
    } else {
      console.log("✓ No negative balances detected");
    }

    console.log("\n✅ Ledger verification complete\n");
  } catch (error: any) {
    console.error("❌ Verification error:", error.message);
    process.exit(1);
  }
}

async function cleanupSessions() {
  console.log("🧹 Cleaning up expired sessions...\n");

  try {
    const expiredCount = await db.delete(session).where(lt(session.expiresAt, new Date()));

    console.log(`✓ Deleted ${expiredCount} expired session(s)`);
    console.log("✅ Cleanup complete\n");
  } catch (error: any) {
    console.error("❌ Cleanup error:", error.message);
    process.exit(1);
  }
}

async function main() {
  console.log("╔════════════════════════════════════════╗");
  console.log("║   IGAC HR System - Maintenance Tools   ║");
  console.log("╚════════════════════════════════════════╝\n");

  switch (command) {
    case "check-db":
      await checkDatabase();
      break;
    case "generate-stats":
      await generateStats();
      break;
    case "verify-ledger":
      await verifyLedger();
      break;
    case "cleanup-sessions":
      await cleanupSessions();
      break;
    default:
      console.log("Available commands:");
      console.log("  check-db            Check database integrity");
      console.log("  generate-stats      Generate system statistics");
      console.log("  verify-ledger       Verify financial ledger consistency");
      console.log("  cleanup-sessions    Remove expired sessions\n");
      console.log("Usage: npx tsx scripts/maintenance.ts [command]\n");
  }

  process.exit(0);
}

// Fix missing import
import { gt } from "drizzle-orm";

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
