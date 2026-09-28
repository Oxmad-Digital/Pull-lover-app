import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import "./dashboard.css";
import "./dashboard-theme.css";
import { NO_INDEX } from "@/app/lib/seo";

export const metadata = { title: "Mon espace", robots: NO_INDEX };

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/auth/login");

  if (session.user.role === "admin") redirect("/admin");

  return (
    <div className="db-layout">
      <Sidebar user={session.user} />
      <main className="db-main">
        {children}
      </main>
    </div>
  );
}
