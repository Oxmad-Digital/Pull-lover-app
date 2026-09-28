import AdminSidebar from "./components/AdminSidebar";
import "./admin-layout.css";
import "./admin-theme.css";
import { NO_INDEX } from "@/app/lib/seo";

export const metadata = { title: "Administration", robots: NO_INDEX };

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">{children}</div>
    </div>
  );
}
