import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import MainContentWrapper from "@/components/MainContentWrapper";
import ManualModal from "@/components/ManualModal";
import { ToastContainer } from "@/components/Toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";


import { getSession } from "@/lib/session";
import { getMergedPermissions } from "@/lib/permissions";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SINTAK | Dashboard",
  description: "SINTAK - Sistem Informasi Cetak - Divisi Percetakan PT Buya Barokah",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  
  // Fetch latest user data (photo) directly from DB to avoid session size limits
  let userPhoto = null;
  if (session?.userId) {
    try {
      const result = await (await import("@/lib/db")).default.execute({
        sql: 'SELECT photo FROM users WHERE id = ?',
        args: [session.userId]
      });
      userPhoto = result.rows[0]?.photo as string | null;
    } catch (e) {
      console.error("Failed to fetch user photo for layout", e);
    }
  }
  
  // Format user data if session exists
  const user = session ? {
    name: session.name,
    username: session.username,
    role: session.role,
    roles: Array.isArray(session.roles) && session.roles.length > 0
      ? session.roles
      : (session.role ? [session.role] : []),
    photo: userPhoto || session.photo, // Prioritize fresh photo from DB
  } : null;

  // Fetch permissions untuk semua role user (union jika multiple)
  const userRoles = Array.isArray(session?.roles) && session!.roles.length > 0
    ? session!.roles
    : (session?.role ? [session.role] : []);
  const permissions = userRoles.length > 0 ? await getMergedPermissions(userRoles) : {};

  return (
    <html lang="id" className="overflow-hidden">
      <body className={`${outfit.className} overflow-hidden h-[100dvh] w-screen`}>
        <MainContentWrapper user={user} permissions={permissions}>
          {children}
        </MainContentWrapper>
        <ManualModal />
        <ToastContainer />
        <SpeedInsights />
        <Analytics />
      </body>

    </html>
  );
}

















