import { NavLink } from "react-router-dom";
import { Home, Calendar, Compass, Package, ShoppingCart } from "lucide-react";
import "./Navigation.css";

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={22} strokeWidth={2.5} />
        <span>Trang chủ</span>
      </NavLink>
      <NavLink to="/meal-planner" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Calendar size={22} strokeWidth={2.5} />
        <span>Kế hoạch</span>
      </NavLink>
      <NavLink to="/recipes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Compass size={22} strokeWidth={2.5} />
        <span>Khám phá</span>
      </NavLink>
      <NavLink to="/pantry" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Package size={22} strokeWidth={2.5} />
        <span>Tủ lạnh</span>
      </NavLink>
      <NavLink to="/shopping-list" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingCart size={22} strokeWidth={2.5} />
        <span>Giỏ hàng</span>
      </NavLink>
    </nav>
  );
}

export default BottomNav;
