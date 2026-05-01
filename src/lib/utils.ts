import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format paisa → BDT display string e.g. 500000 → "৳5,000.00" */
export function formatBDT(paisa: number): string {
  const taka = paisa / 100;
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    minimumFractionDigits: 2,
  }).format(taka).replace("BDT", "৳");
}

/** Convert taka input to paisa for storage */
export function takaToPaisa(taka: number): number {
  return Math.round(taka * 100);
}

/** Convert paisa to taka for display */
export function paisaToTaka(paisa: number): number {
  return paisa / 100;
}

/** Generate next IGAC employee ID */
export function generateEmployeeId(count: number): string {
  return `IGAC-${String(count + 1).padStart(4, "0")}`;
}

/** Format date nicely */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}

/** Leave policy configuration (days per year) */
export const LEAVE_POLICY = {
  annual: 21,      // Yearly quota
  sick: 14,        // Yearly quota
  casual: 10,      // Yearly quota
  unpaid: 999,     // Unlimited
  maternity: 120,  // One-time, 120 days
  paternity: 10,   // One-time, 10 days (subject to policy)
  other: 0,        // Case-by-case
};

/** Calculate days between two dates (excluding weekends) */
export function calculateWorkDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday & Saturday
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

/**
 * Calculate leave balance for a member
 * Returns { used, remaining, quota } per leave type
 */
export function calculateLeaveBalance(
  approvedLeaves: Array<{ type: string; startDate: Date | null; endDate: Date | null }> = []
): Record<string, { used: number; remaining: number; quota: number }> {
  const balance: Record<string, { used: number; remaining: number; quota: number }> = {};
  
  // Initialize each leave type
  Object.entries(LEAVE_POLICY).forEach(([type, quota]) => {
    balance[type] = { used: 0, remaining: quota, quota };
  });
  
  // Calculate used days per type
  approvedLeaves.forEach(leave => {
    if (leave.startDate && leave.endDate) {
      const daysUsed = calculateWorkDays(new Date(leave.startDate), new Date(leave.endDate));
      if (balance[leave.type]) {
        balance[leave.type].used += daysUsed;
        balance[leave.type].remaining = Math.max(0, balance[leave.type].quota - balance[leave.type].used);
      }
    }
  });
  
  return balance;
}
