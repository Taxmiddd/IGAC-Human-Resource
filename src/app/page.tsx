import { redirect } from "next/navigation";

// Root "/" is handled by middleware → redirects to /dashboard or /login
// This is a fallback in case middleware misses it.
export default function RootPage() {
  redirect("/dashboard");
}
