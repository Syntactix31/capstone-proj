import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifySessionToken } from "../lib/auth/session";

// Protect all dashboard pages so only logged-in admins can view them.
export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = verifySessionToken(token);

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/");
  }

  return children;
}
