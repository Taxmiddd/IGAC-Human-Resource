import { db } from "./src/lib/db";
import { user } from "./src/lib/db/schema";
import { auth } from "./src/lib/auth"; // Better Auth instance

async function main() {
  const users = await db.select().from(user);
  console.log("Users in DB:", users);

  if (users.length === 0) {
    console.log("No users. Let's create one using Better Auth's local API context if possible, or just Drizzle.");
  }
}
main();
