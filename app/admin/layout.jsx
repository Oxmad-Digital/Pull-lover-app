import AdminSidebar from "./components/AdminSidebar";
import "./admin-layout.css";
import "./admin-theme.css";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
