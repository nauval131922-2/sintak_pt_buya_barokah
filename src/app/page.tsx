import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getFirstAccessibleRoute } from "@/lib/permissions";

export default async function RootPage() {
  const session = await getSession();

  if (!session || !session.userId) {
    redirect("/login");
  }

  const roles = Array.isArray(session.roles) && session.roles.length > 0
    ? session.roles
    : [session.role];
  const firstRoute = await getFirstAccessibleRoute(roles);
  redirect(firstRoute);
}











