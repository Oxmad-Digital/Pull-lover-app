import AdminSidebar from "./components/AdminSidebar";
import "../globals.css";
import "./admin-layout.css";
import "./admin-theme.css";
import { montserrat } from "../fonts";
import { NO_INDEX } from "@/app/lib/seo";

export const metadata = { title: "Administration | Pull-Lover", robots: NO_INDEX };

// Layout racine de l'administration (en français uniquement) : le site public a le sien dans app/[lang]
export default function AdminLayout({ children }) {
  return (
    <html lang="fr" className={montserrat.variable}>
      <body className={montserrat.className}>
        <div className="admin-layout">
          <AdminSidebar />
          <div className="admin-main">{children}</div>
        </div>
      </body>
    </html>
  );
}
