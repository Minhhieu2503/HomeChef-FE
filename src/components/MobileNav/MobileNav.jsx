import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Search, Package, User, Target } from "lucide-react";
import "./MobileNav.css";

const MobileNav = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="mobile-nav">
      <Link to="/" className={`mobile-nav-item ${path === "/" ? "active" : ""}`}>
        <Home size={22} />
      </Link>
      <Link to="/meal-planner" className={`mobile-nav-item ${path === "/meal-planner" ? "active" : ""}`}>
        <Calendar size={22} />
      </Link>
      <Link to="/recipes" className={`mobile-nav-item ${path === "/recipes" ? "active" : ""}`}>
        <Search size={22} />
      </Link>
      <Link to="/pantry" className={`mobile-nav-item ${path === "/pantry" ? "active" : ""}`}>
        <Package size={22} />
      </Link>
      <Link to="/test-goal" className={`mobile-nav-item ${path === "/test-goal" ? "active" : ""}`}>
        <Target size={22} />
      </Link>
      <Link to="/profile" className={`mobile-nav-item ${path === "/profile" ? "active" : ""}`}>
        <User size={22} />
      </Link>
    </nav>
  );
};

export default MobileNav;
