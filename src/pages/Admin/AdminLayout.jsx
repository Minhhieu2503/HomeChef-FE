import React from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { authUtils } from "../../utils/authUtils";
import { 
  LogOut, LayoutDashboard, Users, ChefHat, Settings, 
  CreditCard, Bell, ChevronRight, User as UserIcon
} from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminRecipes from "./AdminRecipes";
import AdminSystem from "./AdminSystem";
import AdminPayments from "./AdminPayments";
import "./AdminLayout.css";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authUtils.removeToken();
    window.location.href = "/#/login";
    window.location.reload();
  };

  const menuItems = [
    { path: "/admin", icon: <LayoutDashboard size={20} />, label: "Tổng quan", category: "Báo cáo" },
    { path: "/admin/users", icon: <Users size={20} />, label: "Người dùng", category: "Quản lý" },
    { path: "/admin/recipes", icon: <ChefHat size={20} />, label: "Công thức", category: "Nội dung" },
    { path: "/admin/payments", icon: <CreditCard size={20} />, label: "Thanh toán", category: "Giao dịch" },
  ];

  // Helper to get current page label for breadcrumbs
  const currentItem = menuItems.find(item => item.path === location.pathname) || { label: "Admin" };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="logo-icon">👨‍🍳</div>
          <h2>HomeChef <span>Admin</span></h2>
        </div>

        <nav className="admin-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <div className="nav-label">
                <span className="title">{item.label}</span>
                <span className="cat">{item.category}</span>
              </div>
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="btn-logout-main" onClick={handleLogout}>
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-top-bar-premium">
          <div className="header-left">
            <div className="breadcrumbs">
              <span className="root">Quản trị</span>
              <ChevronRight size={14} className="sep" />
              <span className="current">{currentItem.label}</span>
            </div>
          </div>
          
          <div className="header-right">
            <button className="icon-btn-header">
              <Bell size={20} />
              <span className="notif-dot"></span>
            </button>
            <div className="divider-v"></div>
            <div className="admin-profile-pro">
              <div className="profile-text">
                <span className="name">Admin Chef</span>
                <span className="role">Quản trị viên cấp cao</span>
              </div>
              <div className="avatar-pro">
                <UserIcon size={20} color="white" />
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content-inner">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="recipes" element={<AdminRecipes />} />
            <Route path="payments" element={<AdminPayments />} />
          </Routes>
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .admin-top-bar-premium {
          height: 80px;
          padding: 0 2.5rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .breadcrumbs .root { color: #94a3b8; font-weight: 500; font-size: 0.9rem; }
        .breadcrumbs .sep { color: #cbd5e1; }
        .breadcrumbs .current { color: #0f172a; font-weight: 700; font-size: 0.95rem; }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .icon-btn-header {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          position: relative;
          transition: 0.2s;
        }

        .icon-btn-header:hover { background: #f1f5f9; color: #10b981; }

        .notif-dot {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
        }

        .divider-v {
          width: 1px;
          height: 24px;
          background: #e2e8f0;
        }

        .admin-profile-pro {
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
        }

        .profile-text { text-align: right; }
        .profile-text .name { display: block; font-weight: 700; font-size: 0.95rem; color: #0f172a; }
        .profile-text .role { display: block; font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

        .avatar-pro {
          width: 44px;
          height: 44px;
          background: #10b981;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 15px -3px rgba(16, 185, 129, 0.3);
        }

        .btn-logout-main {
          width: 100%;
          padding: 0.85rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: 0.2s;
          margin-top: auto;
        }
        .btn-logout-main:hover { transform: scale(1.02); filter: brightness(1.1); }
      `}} />
    </div>
  );
};

export default AdminLayout;
