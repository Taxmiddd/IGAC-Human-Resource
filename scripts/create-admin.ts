import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";
import { user } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Founder";

  if (!email || !password) {
    console.error("Usage: npm run create-admin <email> <password> [name]");
    process.exit(1);
  }

  console.log(`Creating/Updating founder user: ${email}...`);

  try {
    // Check if user already exists
    const existing = await db.select().from(user).where(eq(user.email, email));
    if (existing.length > 0) {
      console.log(`User ${email} already exists. Setting role to founder...`);
      await db.update(user).set({ role: "founder" }).where(eq(user.email, email));
      console.log("Done.");
      process.exit(0);
    }

    // Create user via Better Auth API
    const res = await auth.api.signUpEmail({
      headers: new Headers(),
      body: {
        email,
        password,
        name,
      }
    });
    
    if (res?.user) {
       await db.update(user).set({ role: "founder" }).where(eq(user.id, res.user.id));
       console.log("Founder account created successfully!");
       console.log("You can now log in and manage invitations.");
    } else {
       console.error("Failed to create founder account:", res);
    }

  } catch (error) {
    console.error("Error creating founder account:", error);
  }
  process.exit(0);
}

main();
