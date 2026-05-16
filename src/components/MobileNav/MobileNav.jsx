import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Search, Package, User } from "lucide-react";
import "./MobileNav.css";

const MobileNav = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="mobile-nav">
      <Link to="/" className={`nav-item ${path === "/" ? "active" : ""}`}>
        <Home size={22} />
        <span>Home</span>
      </Link>
      <Link to="/meal-planner" className={`nav-item ${path === "/meal-planner" ? "active" : ""}`}>
        <Calendar size={22} />
        <span>Planner</span>
      </Link>
      <Link to="/recipes" className={`nav-item ${path === "/recipes" ? "active" : ""}`}>
        <Search size={22} />
        <span>Explore</span>
      </Link>
      <Link to="/pantry" className={`nav-item ${path === "/pantry" ? "active" : ""}`}>
        <Package size={22} />
        <span>Pantry</span>
      </Link>
      <Link to="/profile" className={`nav-item ${path === "/profile" ? "active" : ""}`}>
        <User size={22} />
        <span>Profile</span>
      </Link>
    </nav>
  );
};

export default MobileNav;
