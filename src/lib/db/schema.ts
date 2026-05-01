import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ─── BETTER AUTH TABLES ───────────────────────────────────────────────────────

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["founder", "core_admin", "management"] }).notNull().default("management"),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

// ─── DEPARTMENTS ──────────────────────────────────────────────────────────────

export const departments = sqliteTable("departments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  createdBy: text("created_by").references(() => user.id),
});

// ─── MEMBERS ──────────────────────────────────────────────────────────────────

export const members = sqliteTable("members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  employeeId: text("employee_id").unique(), // e.g. IGAC-001

  // Identity
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  photoUrl: text("photo_url"),
  address: text("address"),
  city: text("city"),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  nationalId: text("national_id"),

  // IGAC org role
  igacRole: text("igac_role", {
    enum: ["secretary_general", "deputy_sg", "director", "manager", "coordinator", "associate", "observer"],
  }).notNull().default("associate"),

  // Department
  departmentId: text("department_id").references(() => departments.id),

  // Lifecycle status
  memberStatus: text("member_status", {
    enum: ["active", "on_leave", "resigned", "laid_off"],
  }).notNull().default("active"),

  // Activity tracking
  activeness: text("activeness", {
    enum: ["active", "inactive"],
  }).notNull().default("active"),

  responsiveness: text("responsiveness", {
    enum: ["responsive", "unresponsive"],
  }).notNull().default("responsive"),

  // Dates
  joiningDate: integer("joining_date", { mode: "timestamp" }),
  resignationDate: integer("resignation_date", { mode: "timestamp" }),

  // Family information
  fatherName: text("father_name"),
  fatherPhone: text("father_phone"),
  motherName: text("mother_name"),
  motherPhone: text("mother_phone"),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),

  // Social links
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),

  // Internal notes
  notes: text("notes"),

  // Audit
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  createdBy: text("created_by").references(() => user.id),
});

// ─── MEMBER STATUS LOG ────────────────────────────────────────────────────────

export const memberStatusLog = sqliteTable("member_status_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  field: text("field").notNull(), // 'member_status' | 'activeness' | 'responsiveness'
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  reason: text("reason"),
  changedBy: text("changed_by").references(() => user.id),
  changedAt: integer("changed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── FINANCIAL LEDGER ─────────────────────────────────────────────────────────
// Append-only. Never UPDATE — immutable audit trail.
// Amounts stored in paisa (1 BDT = 100 paisa) to avoid float rounding.

export const financialLedger = sqliteTable("financial_ledger", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),

  transactionType: text("transaction_type", {
    enum: ["event_payment", "stipend", "allowance", "bonus", "deduction", "reimbursement", "advance"],
  }).notNull(),

  purpose: text("purpose").notNull(),   // What the money was for (required)
  eventName: text("event_name"),        // Optional event name

  // BDT amounts in paisa (÷100 to display)
  allotted: integer("allotted").notNull().default(0),   // Budgeted amount
  disbursed: integer("disbursed").notNull().default(0), // Actually paid out

  currency: text("currency").notNull().default("BDT"),

  periodMonth: integer("period_month"), // 1–12
  periodYear: integer("period_year"),

  notes: text("notes"),

  // Audit — immutable once written
  recordedBy: text("recorded_by").notNull().references(() => user.id),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),

  assignedTo: text("assigned_to").references(() => members.id),
  createdBy: text("created_by").notNull().references(() => user.id),

  priority: text("priority", {
    enum: ["low", "medium", "high", "critical"],
  }).notNull().default("medium"),

  status: text("status", {
    enum: ["todo", "in_progress", "review", "completed", "cancelled"],
  }).notNull().default("todo"),

  eventName: text("event_name"),
  dueDate: integer("due_date", { mode: "timestamp" }),

  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── LEAVE REQUESTS ─────────────────────────────────────────────────────────────

export const leaveRequests = sqliteTable("leave_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["sick", "vacation", "unpaid", "maternity", "paternity", "other"] }).notNull(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  approvedBy: text("approved_by").references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── INVITATIONS ──────────────────────────────────────────────────────────────

export const invitation = sqliteTable("invitation", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role", { enum: ["founder", "core_admin", "management"] }),
  inviterId: text("inviter_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// ─── MEMBER DOCUMENTS ─────────────────────────────────────────────────────────

export const memberDocuments = sqliteTable("member_documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  documentType: text("document_type", { enum: ["id_card", "contract", "nda", "certificate", "other"] }).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  uploadedAt: integer("uploaded_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ─── RELATIONS ────────────────────────────────────────────────────────────────

export const departmentsRelations = relations(departments, ({ many }) => ({
  members: many(members),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  department: one(departments, {
    fields: [members.departmentId],
    references: [departments.id],
  }),
  creator: one(user, {
    fields: [members.createdBy],
    references: [user.id],
  }),
  statusLogs: many(memberStatusLog),
  financialRecords: many(financialLedger),
  tasks: many(tasks),
  leaveRequests: many(leaveRequests),
  documents: many(memberDocuments),
}));

export const memberStatusLogRelations = relations(memberStatusLog, ({ one }) => ({
  member: one(members, {
    fields: [memberStatusLog.memberId],
    references: [members.id],
  }),
}));

export const financialLedgerRelations = relations(financialLedger, ({ one }) => ({
  member: one(members, {
    fields: [financialLedger.memberId],
    references: [members.id],
  }),
  recorder: one(user, {
    fields: [financialLedger.recordedBy],
    references: [user.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(members, {
    fields: [tasks.assignedTo],
    references: [members.id],
  }),
  creator: one(user, {
    fields: [tasks.createdBy],
    references: [user.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  member: one(members, {
    fields: [leaveRequests.memberId],
    references: [members.id],
  }),
  approver: one(user, {
    fields: [leaveRequests.approvedBy],
    references: [user.id],
  }),
}));

export const memberDocumentsRelations = relations(memberDocuments, ({ one }) => ({
  member: one(members, {
    fields: [memberDocuments.memberId],
    references: [members.id],
  }),
}));

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type Member = typeof members.$inferSelect;
export type MemberStatusLog = typeof memberStatusLog.$inferSelect;
export type FinancialLedger = typeof financialLedger.$inferSelect;
export type Task = typeof tasks.$inferSelect;

export type NewMember = typeof members.$inferInsert;
export type NewFinancialLedger = typeof financialLedger.$inferInsert;
export type NewTask = typeof tasks.$inferInsert;
export type NewDepartment = typeof departments.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type MemberDocument = typeof memberDocuments.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
export type NewMemberDocument = typeof memberDocuments.$inferInsert;
