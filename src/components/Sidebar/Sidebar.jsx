import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { getAllRecipes } from "../../services/recipeService";
import "./Sidebar.css";

const navItems = [
  { path: "/", label: "Tổng quan", icon: "📊" },
  { path: "/meal-planner", label: "Kế hoạch", icon: "📅" },
  { path: "/recipes", label: "Công thức", icon: "🍳" },
  { path: "/pantry", label: "Tủ lạnh", icon: "🥬" },
  { path: "/test-goal", label: "Kiểm thử", icon: "🎯" },
];

function Sidebar() {
  const location = useLocation();
  const [userName, setUserName] = useState("Đang tải...");
  const [trayRecipes, setTrayRecipes] = useState([]);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authService.getMe();
        if (res.success && res.data) {
          setUserName(res.data.name);
        }
      } catch (err) {
        setUserName("Người dùng");
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (location.pathname === "/meal-planner") {
      const fetchTray = async () => {
        try {
          const res = await authService.getSavedRecipes();
          setTrayRecipes(res.data || []);
        } catch (e) {
          console.error(e);
        }
      };
      fetchTray();
    }
  }, [location.pathname]);

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsMobileOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="mobile-brand">
          <span className="brand-logo-small">🍳</span>
          <span className="brand-name-small">Đầu bếp tại gia</span>
        </div>
        <div style={{ width: 24 }}></div> {/* Spacer for centering */}
      </div>

      {/* Overlay Backdrop */}
      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">🍳</div>
          <div className="brand-info">
            <span className="brand-name">Đầu bếp tại gia</span>
            <span className="brand-subtitle">Urban Culinary</span>
          </div>
          <button className="close-sidebar-btn" onClick={() => setIsMobileOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>

          {location.pathname === "/meal-planner" && (
            <div className="sidebar-extra">
              <span className="extra-label">RECIPE TRAY</span>
              <div className="tray-scroll">
                {trayRecipes.slice(0, 5).map(recipe => (
                  <div 
                    key={recipe._id} 
                    className="tray-recipe-card"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("recipeId", recipe._id);
                      e.dataTransfer.setData("recipeTitle", recipe.title);
                      e.dataTransfer.setData("recipeCal", recipe.calories || 300);
                      e.dataTransfer.setData("recipeImg", recipe.image);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                  >
                    <img src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200"} alt={recipe.title} />
                    <div className="tray-recipe-info">
                      <h4>{recipe.title}</h4>
                      <span>{recipe.calories || 300} kcal</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/pricing" style={{ textDecoration: 'none', width: '100%' }}>
            <button className="btn-upgrade">
              Nâng cấp tài khoản
            </button>
          </NavLink>

          <NavLink to="/profile" className="sidebar-user" style={{ textDecoration: 'none' }}>
            <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{userName}</span>
              <span className="user-role">Hồ sơ</span>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
