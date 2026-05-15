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

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">🍳</div>
        <div className="brand-info">
          <span className="brand-name">Đầu bếp tại gia</span>
          <span className="brand-subtitle">Urban Culinary</span>
        </div>
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
  );
}

export default Sidebar;
