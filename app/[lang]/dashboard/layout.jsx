import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/authOptions";
import { redirect } from "next/navigation";
import Sidebar from "./components/Sidebar";
import "./dashboard.css";
import "./dashboard-theme.css";
import { privatePageMetadata } from "@/app/lib/seo";
import { localePath } from "@/app/i18n/config.mjs";

export const generateMetadata = privatePageMetadata({ fr: "Mon espace", en: "My account" });

export default async function DashboardLayout({ children, params }) {
  const { lang } = await params;
  const session = await getServerSession(authOptions);

  if (!session) redirect(localePath(lang, "/auth/login"));

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
