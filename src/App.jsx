import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import FeedbackGate from "./components/FeedbackGate/FeedbackGate";
import { authService } from "./services/auth.service";
import Sidebar from "./components/Sidebar/Sidebar";
import MobileNav from "./components/MobileNav/MobileNav";
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
import FamilyManagement from "./pages/Profile/FamilyManagement";
import SmartCook from "./pages/SmartCook/SmartCook";
import AdminLayout from "./pages/Admin/AdminLayout";
import Pricing from "./pages/Pricing/Pricing";
import PaymentResult from "./pages/Pricing/PaymentResult";
import TestGoal from "./pages/TestGoal/TestGoal";
import FoodWasteQuiz from "./pages/FoodWasteQuiz/FoodWasteQuiz";

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

function AppContent({ isNative }) {
  const [user, setUser] = useState(authUtils.getUser());
  const [recipeViews, setRecipeViews] = useState(0);
  const location = useLocation();

  // Sync user from localStorage on route change
  useEffect(() => {
    setUser(authUtils.getUser());
    
    // Update recipe views count from localStorage
    const viewed = JSON.parse(localStorage.getItem("viewedRecipes") || "[]");
    setRecipeViews(viewed.length);
  }, [location.pathname]);

  // Track unique recipe views
  useEffect(() => {
    if (location.pathname.startsWith("/recipes/") && location.pathname !== "/recipes" && location.pathname !== "/recipes/") {
      const recipeId = location.pathname.split("/recipes/")[1];
      if (recipeId && recipeId !== "new") { // ignore "new" if they are creating a recipe
        const viewed = JSON.parse(localStorage.getItem("viewedRecipes") || "[]");
        if (!viewed.includes(recipeId)) {
          viewed.push(recipeId);
          localStorage.setItem("viewedRecipes", JSON.stringify(viewed));
          setRecipeViews(viewed.length);
        }
      }
    }
  }, [location.pathname]);

  // Sync latest user details from server to ensure feedback status is correct
  useEffect(() => {
    if (authUtils.isAuthenticated()) {
      authService.getMe()
        .then((res) => {
          if (res.success && res.data) {
            authUtils.setUser(res.data);
            setUser(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to sync user profile:", err);
        });
    }
  }, [location.pathname]);

  // Determine if feedback gate should be shown
  const isUser = user && user.role === "user";
  const hasNotGivenFeedback = user && !user.hasGivenFeedback;
  const metMealsCondition = user && user.completedMealsCount >= 1;
  const metViewsCondition = recipeViews >= 3;

  const showFeedbackGate = isUser && hasNotGivenFeedback && (metMealsCondition || metViewsCondition);

  const handleUnlock = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <>
      {showFeedbackGate && (
        <FeedbackGate user={user} onUnlock={handleUnlock} />
      )}
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
              <div className={`app-layout ${isNative ? "is-native-app" : ""}`}>
                {isNative ? <MobileNav /> : <Sidebar />}
                <main className="main-content">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/meal-planner" element={<MealPlanner />} />
                    <Route path="/recipes" element={<Recipes />} />
                    <Route path="/recipes/:id" element={<RecipeDetail />} />
                    <Route path="/pantry" element={<Pantry />} />
                    <Route path="/shopping-list" element={<ShoppingList />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/profile/family" element={<FamilyManagement />} />
                    <Route path="/smart-cook" element={<SmartCook />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/payment-result" element={<PaymentResult />} />
                    <Route path="/test-goal" element={<TestGoal />} />
                    <Route path="/food-waste-quiz" element={<FoodWasteQuiz />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

function App() {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const checkPlatform = () => {
      const isNativePlatform = Capacitor.isNativePlatform();
      const isSmallScreen = window.innerWidth <= 768;
      
      // If it's native OR a small screen, we treat it as a mobile app experience
      const shouldShowMobile = isNativePlatform || isSmallScreen;
      
      setIsNative(shouldShowMobile);
      
      if (shouldShowMobile) {
        document.body.classList.add("is-native-app");
      } else {
        document.body.classList.remove("is-native-app");
      }
    };

    checkPlatform();
    window.addEventListener('resize', checkPlatform);
    return () => window.removeEventListener('resize', checkPlatform);
  }, []);

  return (
    <Router>
      <AppContent isNative={isNative} />
    </Router>
  );
}

export default App;
