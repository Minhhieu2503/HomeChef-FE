import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { authService } from "../../services/auth.service";
import { getAllRecipes } from "../../services/recipeService";
import { getDashboardOverview } from "../../services/dashboardService";
import { updateShoppingItem } from "../../services/shoppingService";
import { Bell, Search, Clock, Flame, ChevronRight, Star, CheckCircle2 } from "lucide-react";
import "./Home.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [allRecipes, setAllRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All Recipes");
  const [overview, setOverview] = useState({
    nutrition: { calories: { current: 0, goal: 2000 }, protein: { current: 0, goal: 80 } },
    groceries: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [profileRes, recipesData, overviewData] = await Promise.all([
          authService.getMe(),
          getAllRecipes(),
          getDashboardOverview()
        ]);

        if (profileRes.success) setUser(profileRes.data);

        const recipesArray = Array.isArray(recipesData) ? recipesData : (recipesData?.recipes || []);
        setAllRecipes(recipesArray);

        if (overviewData.success) {
          setOverview(overviewData.data);
        }
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleToggleGrocery = async (itemId, currentChecked) => {
    try {
      // Optimistic update
      setOverview(prev => ({
        ...prev,
        groceries: prev.groceries.map(item =>
          item._id === itemId ? { ...item, checked: !currentChecked } : item
        )
      }));

      await updateShoppingItem(itemId, { checked: !currentChecked });
    } catch (error) {
      console.error("Failed to update grocery item:", error);
      // Revert on error (optional, but good practice)
      const overviewData = await getDashboardOverview();
      if (overviewData.success) setOverview(overviewData.data);
    }
  };

  const filters = ["Tất cả", "Dưới 15 phút", "Ít Tinh bột", "Nhiều Đạm", "Chay"];

  const filteredRecipes = allRecipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeFilter === "Tất cả") return matchesSearch;
    if (activeFilter === "Dưới 15 phút") return matchesSearch && (recipe.cookTime || 20) < 15;
    if (activeFilter === "Ít Tinh bột") return matchesSearch && (recipe.calories || 350) < 400; 
    if (activeFilter === "Nhiều Đạm") return matchesSearch && (recipe.protein || 20) > 25; 
    if (activeFilter === "Chay") return matchesSearch && recipe.tags?.includes("Vegan");
    return matchesSearch;
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const trendingRecipes = filteredRecipes.slice(0, 4);

  return (
    <div className="dashboard">
      {/* 1. Dashboard Header */}
      {!Capacitor.isNativePlatform() ? (
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Xin chào, {user?.name || "Đầu bếp"}!</h1>
            <p>Hôm nay bạn muốn nấu món gì?</p>
          </div>

          <div className="header-right">
            <form className="smart-search" onSubmit={handleSearch}>
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Tìm kiếm công thức..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn-search-header">Tìm</button>
            </form>

            <div className="header-actions">
              <button className="notification-btn" title="Thông báo" onClick={() => alert('Hiện tại bạn không có thông báo mới.')}>
                <Bell size={24} />
                <span className="notification-badge"></span>
              </button>
              <div className="user-profile-summary" onClick={() => navigate('/profile')}>
                <img
                  src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=4ADE80&color=fff"}
                  alt="Avatar"
                  className="user-avatar-small"
                />
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className="mobile-dashboard-header">
          <div className="mobile-header-top">
            <div className="mobile-user-greeting">
              <img
                src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=4ADE80&color=fff"}
                alt="Avatar"
                className="mobile-avatar"
                onClick={() => navigate('/profile')}
              />
              <div className="mobile-greeting-text">
                <span className="welcome-sub">Chào mừng trở lại,</span>
                <span className="user-name-pro">{user?.name?.split(' ')[0] || "Đầu bếp"}!</span>
              </div>
            </div>
            <div className="mobile-nutrition-circle" onClick={() => navigate('/meal-planner')}>
              <div className="circle-inner">
                <span className="circle-percent">{Math.round((overview.nutrition.calories.current / overview.nutrition.calories.goal) * 100) || 0}%</span>
                <span className="circle-label">Mục tiêu</span>
              </div>
              <svg className="circle-svg">
                <circle cx="22" cy="22" r="20" className="circle-bg" />
                <circle cx="22" cy="22" r="20" className="circle-fill" style={{ strokeDasharray: `${Math.min(100, (overview.nutrition.calories.current / overview.nutrition.calories.goal) * 100) * 1.25}, 126` }} />
              </svg>
            </div>
          </div>
          <form className="mobile-smart-search" onSubmit={handleSearch}>
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm món ngon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
        </header>
      )}

      {/* 2. Hero Section */}
      <section className="hero-section">
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80"
          alt="Inspiration"
          className="hero-banner"
        />
        <div className="hero-content">
          <h2>Cảm Hứng Mỗi Ngày</h2>
          <p>Bắt đầu ngày mới với những công thức đầy năng lượng và dinh dưỡng.</p>
          <button className="btn-view-plan" onClick={() => navigate('/meal-planner')}>Xem kế hoạch hôm nay</button>
        </div>
      </section>

      {/* 3. Quick Filters */}
      <div className="quick-filters">
        {filters.map(filter => (
          <button
            key={filter}
            className={`filter-tag ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* 4. Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Trending Section */}
        <section className="trending-section">
          <div className="section-header">
            <h3>Thịnh hành hiện nay</h3>
            <Link to="/recipes" className="view-all-btn">Xem tất cả <ChevronRight size={16} /></Link>
          </div>

          <div className="recipe-grid">
            {loading ? (
              <p>Đang tải món ngon...</p>
            ) : (
              trendingRecipes.map(recipe => (
                <div key={recipe._id} className="recipe-card">
                  <div className="card-image-wrapper">
                    <img src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"} alt={recipe.title} />
                    <div className="card-badges">
                      <span className="badge badge-difficulty">{recipe.difficulty || "Medium"}</span>
                      <span className="badge badge-time">{recipe.cookTime || 20} min</span>
                    </div>
                  </div>
                  <div className="recipe-card-content">
                    <div className="card-rating">
                      <Star size={14} fill="#fbbf24" />
                      <span>{recipe.rating || "4.8"}</span>
                    </div>
                    <h4>{recipe.title}</h4>
                    <Link to={`/recipes/${recipe._id}`}>
                      <button className="btn-start-cooking">Bắt đầu nấu</button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 5. Dashboard Sidebar */}
        <aside className="dashboard-sidebar">
          {/* Nutrition Widget */}
          <div className="sidebar-widget">
            <div className="widget-title">
              <span>Dinh dưỡng</span>
              <span className="text-xs text-muted">Mục tiêu ngày</span>
            </div>
            <div className="nutrition-stats">
              <div className="stat-item">
                <div className="stat-info">
                  <span className="stat-label">Calories</span>
                  <span className="stat-value">{overview.nutrition.calories.current.toLocaleString()} / {overview.nutrition.calories.goal.toLocaleString()} kcal</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, (overview.nutrition.calories.current / overview.nutrition.calories.goal) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-info">
                  <span className="stat-label">Protein</span>
                  <span className="stat-value">{overview.nutrition.protein.current} / {overview.nutrition.protein.goal} g</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (overview.nutrition.protein.current / overview.nutrition.protein.goal) * 100)}%`,
                      backgroundColor: '#3B82F6'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Groceries Widget */}
          <div className="sidebar-widget">
            <div className="widget-title">
              <span>Danh sách đi chợ</span>
              <Link to="/shopping-list" className="text-xs text-primary">Mua gấp</Link>
            </div>
            <div className="grocery-list-mini">
              {overview.groceries.length > 0 ? (
                overview.groceries.map(item => (
                  <div key={item._id} className="grocery-item-mini">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleToggleGrocery(item._id, item.checked)}
                    />
                    <span style={{ textDecoration: item.checked ? 'line-through' : 'none', opacity: item.checked ? 0.6 : 1 }}>
                      {item.name}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted py-2">Danh sách trống</p>
              )}
            </div>
            <Link to="/shopping-list" className="view-all-btn">
              Xem toàn bộ danh sách <ChevronRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Dashboard;
