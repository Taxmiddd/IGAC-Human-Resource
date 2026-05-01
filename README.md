<div align="center">
  <img src="./public/IGAC Logo OG NOBG.svg" alt="IGAC Logo" width="180" />
  <h1 style="font-family: serif; font-size: 2.5rem; margin-top: 1rem;">IGAC Human Resource Portal</h1>
  <p><i>International Global Affairs Council — Professional HR Management System</i></p>

  <div style="display: flex; gap: 10px; justify-content: center; margin-top: 1rem;">
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Better_Auth-Secure-navy?style=for-the-badge" alt="Better Auth" />
    <img src="https://img.shields.io/badge/Turso-SQLite-cyan?style=for-the-badge&logo=turso" alt="Turso" />
    <img src="https://img.shields.io/badge/Drizzle-ORM-orange?style=for-the-badge" alt="Drizzle" />
  </div>
</div>

<hr />

## 🏛️ Project Overview

The **IGAC HR Portal** is a high-performance, secure, and aesthetically premium internal management system designed for the **International Global Affairs Council**. Built with the modern web stack, it prioritizes data integrity, role-based access control, and a seamless user experience.

### Key Features
- **Secure Admin Onboarding**: Invitation-based system with manual magic links.
- **Member Directory**: Detailed tracking of identity, roles, and status.
- **Financial Ledger**: Append-only audit trail for BDT transactions (paisa-precision).
- **Task Management**: Priority-based task tracking with assignment system.
- **Leave Requests**: Formalized leave application and approval workflow.
- **Document Vault**: Secure storage for contracts, NDAs, and IDs.

## 🛠️ Tech Stack
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **Auth**: [Better Auth](https://better-auth.com/) (Custom Invitation Flow)
- **Database**: [Turso (libSQL)](https://turso.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Styling**: Vanilla CSS with Design Tokens
- **Icons**: Lucide React

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env.local` file based on `.env.example` and fill in your credentials.

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Initialization
```bash
npm run db:push
```

### 4. Create Founder Account
The system requires an initial "Founder" account to manage invitations. Run this command:
```bash
npm run create-admin <email> <password> "<Your Name>"
```

### 5. Run Locally
```bash
npm run dev
```

## 📜 Maintenance Commands
- `npm run db:studio`: Open Drizzle Studio to view database.
- `npm run maint:check-db`: Verify database health.
- `npm run maint:stats`: Generate system usage statistics.
- `npm run maint:cleanup`: Purge inactive sessions and old logs.

<hr />

<div align="center">
  <p>© 2026 International Global Affairs Council. All rights reserved.</p>
</div>
