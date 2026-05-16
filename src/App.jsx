import { useState } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "./components/Sidebar/Sidebar";
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
    if (!hasSeenOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // User is logged in, ensure onboarding flag is set
  if (!hasSeenOnboarding) {
    localStorage.setItem("hasSeenOnboarding", "true");
  }

  // If Admin tries to access consumer routes, send them to admin panel
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const isAdmin = authUtils.isAdmin();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />

        {/* Admin Routes (Standalone Layout) */}
        <Route 
          path="/admin/*" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          } 
        />

        {/* Protected Consumer Routes inside App Layout */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                {/* Mobile Header - Only visible on small screens */}
                <header className="mobile-header">
                  <button className="menu-toggle" onClick={toggleSidebar}>
                    <Menu size={24} />
                  </button>
                  <div className="mobile-brand">
                    <span>🍳 HomeChef</span>
                  </div>
                  <div style={{ width: 40 }}></div>
                </header>

                {/* Overlay to close sidebar on click */}
                {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

                <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
                
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/meal-planner" element={<MealPlanner />} />
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
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
