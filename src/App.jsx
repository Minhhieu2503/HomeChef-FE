import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar/Sidebar";
import TopHeader from "./components/Navigation/TopHeader";
import BottomNav from "./components/Navigation/BottomNav";
import Dashboard from "./pages/Home/Home";
import MealPlanner from "./pages/MealPlanner/MealPlanner";
import Recipes from "./pages/Recipes/Recipes";
import RecipeDetail from "./pages/RecipeDetail/RecipeDetail";
import Pantry from "./pages/Pantry/Pantry";
import ShoppingList from "./pages/ShoppingList/ShoppingList";
import Onboarding from "./pages/Onboarding/Onboarding";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import Profile from "./pages/Profile/Profile";
import SmartCook from "./pages/SmartCook/SmartCook";
import AdminLayout from "./pages/Admin/AdminLayout";
import Pricing from "./pages/Pricing/Pricing";
import PaymentResult from "./pages/Pricing/PaymentResult";

// Protected Route Component
import { authUtils } from "./utils/authUtils";

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = authUtils.isAuthenticated();
  const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding") === "true";
  const isAdmin = authUtils.isAdmin();

  if (!isLoggedIn) {
    if (!hasSeenOnboarding) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/login" replace />;
  }

  if (!hasSeenOnboarding) localStorage.setItem("hasSeenOnboarding", "true");
  if (isAdmin) return <Navigate to="/admin" replace />;

  return children;
};

const AdminRoute = ({ children }) => {
  const isAdmin = authUtils.isAdmin();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Synchronized mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      // Close sidebar when switching to mobile or if screen is large
      if (mobile) setIsSidebarOpen(false);
    };
    
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />

        {/* Admin Routes */}
        <Route 
          path="/admin/*" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          } 
        />

        {/* Protected Consumer Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className={`app-layout ${isMobile ? 'is-mobile' : 'is-desktop'} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                
                {/* 1. Sidebar (Force hide on mobile via CSS) */}
                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} isMobile={isMobile} />
                
                {/* 2. Top Header (Only Mobile) */}
                {isMobile && <TopHeader toggleSidebar={() => setIsSidebarOpen(true)} />}

                {/* 3. Overlay for mobile sidebar */}
                {isSidebarOpen && isMobile && (
                  <div className="sidebar-overlay" onClick={closeSidebar}></div>
                )}

                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard isMobile={isMobile} />} />
                    <Route path="/meal-planner" element={<MealPlanner isMobile={isMobile} />} />
                    <Route path="/recipes" element={<Recipes isMobile={isMobile} />} />
                    <Route path="/recipes/:id" element={<RecipeDetail isMobile={isMobile} />} />
                    <Route path="/pantry" element={<Pantry isMobile={isMobile} />} />
                    <Route path="/shopping-list" element={<ShoppingList isMobile={isMobile} />} />
                    <Route path="/profile" element={<Profile isMobile={isMobile} />} />
                    <Route path="/smart-cook" element={<SmartCook isMobile={isMobile} />} />
                    <Route path="/pricing" element={<Pricing isMobile={isMobile} />} />
                    <Route path="/payment-result" element={<PaymentResult isMobile={isMobile} />} />
                  </Routes>
                </main>

                {/* 4. Bottom Navigation (Only Mobile) */}
                {isMobile && <BottomNav />}
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
