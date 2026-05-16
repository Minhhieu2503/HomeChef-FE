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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />

        <Route 
          path="/admin/*" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          } 
        />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''} ${isMobile ? 'is-mobile' : 'is-desktop'}`}>
                {isMobile && <TopHeader />}

                {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

                {(!isMobile || isSidebarOpen) && <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />}
                
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/meal-planner" element={<MealPlanner isMobile={isMobile} />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/recipes/:id" element={<RecipeDetail />} />
                    <Route path="/pantry" element={<Pantry />} />
                    <Route path="/shopping-list" element={<ShoppingList />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/smart-cook" element={<SmartCook />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/payment-result" element={<PaymentResult />} />
                  </Routes>
                </main>

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
