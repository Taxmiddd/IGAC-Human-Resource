/**
 * API Request Logging & Audit Trail
 * Tracks all API calls for security and debugging
 */

import { NextRequest } from "next/server";

export interface APILog {
  timestamp: string;
  method: string;
  path: string;
  userId?: string;
  status?: number;
  duration?: number; // ms
  error?: string;
  userAgent?: string;
  ip?: string;
}

const logs: APILog[] = [];
const MAX_LOGS = 1000; // Keep recent logs in memory

/**
 * Extract client IP from request
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Log an API request
 */
export function logRequest(
  method: string,
  path: string,
  userId?: string,
  userAgent?: string,
  ip?: string
): { startTime: number; logId: number } {
  const startTime = Date.now();
  const logId = logs.push({
    timestamp: new Date().toISOString(),
    method,
    path,
    userId,
    userAgent,
    ip,
  }) - 1;

  // Keep log size manageable
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  return { startTime, logId };
}

/**
 * Completes a logged request
 */
export function completeRequest(
  logId: number,
  status: number,
  startTime: number,
  error?: string
) {
  const duration = Date.now() - startTime;
  if (logs[logId]) {
    logs[logId].status = status;
    logs[logId].duration = duration;
    logs[logId].error = error;
  }

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    const statusEmoji = status < 400 ? "✓" : "✗";
    console.log(
      `${statusEmoji} [${logs[logId]?.method}] ${logs[logId]?.path} - ${status} (${duration}ms)`
    );
  }
}

/**
 * Get recent API logs
 */
export function getRecentLogs(limit: number = 100): APILog[] {
  return logs.slice(Math.max(0, logs.length - limit));
}

/**
 * Export logs to CSV
 */
export function exportLogsToCSV(): string {
  const headers = ["Timestamp", "Method", "Path", "Status", "Duration (ms)", "User ID", "IP", "Error"];
  const rows = logs.map(log => [
    log.timestamp,
    log.method,
    log.path,
    log.status ?? "-",
    log.duration ?? "-",
    log.userId ?? "-",
    log.ip ?? "-",
    log.error ?? "-",
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}

/**
 * Get API statistics
 */
export function getAPIStats() {
  const stats = {
    totalRequests: logs.length,
    successRequests: logs.filter(l => l.status! < 400).length,
    errorRequests: logs.filter(l => l.status! >= 400).length,
    avgResponseTime: logs.length > 0 ? Math.round(logs.reduce((s, l) => s + (l.duration || 0), 0) / logs.length) : 0,
    requestsByMethod: {} as Record<string, number>,
    requestsByPath: {} as Record<string, number>,
  };

  logs.forEach(log => {
    stats.requestsByMethod[log.method] = (stats.requestsByMethod[log.method] || 0) + 1;
    stats.requestsByPath[log.path] = (stats.requestsByPath[log.path] || 0) + 1;
  });

  return stats;
}
