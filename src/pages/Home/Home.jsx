import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { authService } from "../../services/auth.service";
import { getAllRecipes } from "../../services/recipeService";
import { getDashboardOverview } from "../../services/dashboardService";
import { updateShoppingItem } from "../../services/shoppingService";
import { getNotifications, markAsRead, markAllAsRead } from "../../services/notificationService";
import { Bell, Search, Clock, Flame, ChevronRight, Star, CheckCircle2 } from "lucide-react";
import "./Home.css";

function Dashboard() {
  const [user, setUser] = useState(null);
  const [allRecipes, setAllRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [overview, setOverview] = useState({
    nutrition: { calories: { current: 0, goal: 2000 }, protein: { current: 0, goal: 80 } },
    groceries: []
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [profileRes, recipesData, overviewData, notifRes] = await Promise.all([
          authService.getMe(),
          getAllRecipes(),
          getDashboardOverview(),
          getNotifications().catch(err => ({ success: false, data: [] }))
        ]);

        if (profileRes.success) setUser(profileRes.data);

        const recipesArray = Array.isArray(recipesData) ? recipesData : (recipesData?.recipes || []);
        setAllRecipes(recipesArray);

        if (overviewData.success) {
          setOverview(overviewData.data);
        }

        if (notifRes.success) {
          setNotifications(notifRes.data);
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

  const handleMarkAsRead = async (id) => {
    try {
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      await markAsRead(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NotificationBell = () => (
    <div className="notification-wrapper">
      <button 
        className="notification-btn" 
        title="Thông báo" 
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell size={24} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                Đọc tất cả
              </button>
            )}
          </div>
          <div className="dropdown-body">
            {notifications.length === 0 ? (
              <p className="no-notifications">Không có thông báo nào</p>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif._id} 
                  className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  onClick={() => {
                    handleMarkAsRead(notif._id);
                    setShowNotifications(false);
                  }}
                >
                  <div className="notif-content">
                    <h4 className="notif-title">
                      {notif.title}
                      {!notif.isRead && <span className="unread-dot"></span>}
                    </h4>
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-time">
                      {new Date(notif.createdAt).toLocaleDateString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );

  const trendingRecipes = filteredRecipes.slice(0, 4);

  return (
    <div className="dashboard">
      {/* 1. Dashboard Header */}
      {!Capacitor.isNativePlatform() ? (
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Xin chào, {user?.name || "Đầu bếp"}!</h1>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Hôm nay bạn muốn nấu món gì?
              <span className="user-health-goal-badge" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>
                Mục tiêu: {user?.healthGoal === "lose_weight" ? "Giảm cân 📉" : user?.healthGoal === "gain_weight" ? "Tăng cân 📈" : "Cân bằng 🥗"}
              </span>
            </p>
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
              <NotificationBell />
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
                <span className="welcome-sub">
                  Mục tiêu: {user?.healthGoal === "lose_weight" ? "Giảm cân 📉" : user?.healthGoal === "gain_weight" ? "Tăng cân 📈" : "Cân bằng 🥗"}
                </span>
                <span className="user-name-pro">{user?.name?.split(' ')[0] || "Đầu bếp"}!</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <NotificationBell />
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

      {/* Food Waste Quiz & Comic Banner */}
      <section className="waste-marketing-banner animate-fadeIn" style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        borderRadius: '16px',
        padding: '20px 24px',
        color: 'white',
        margin: '20px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ flex: 1, zIndex: 2 }}>
          <span style={{ background: '#3b82f6', color: '#eff6ff', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thử Thách Xanh</span>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0 6px 0', color: 'white' }}>Bạn Đang Lãng Phí Bao Nhiêu Thực Phẩm?</h3>
          <p style={{ fontSize: '13px', color: '#bfdbfe', margin: '0 0 16px 0', maxWidth: '500px', lineHeight: '1.5' }}>Tham gia Quiz trắc nghiệm nhanh để khám phá lượng tiền & khí thải nhà kính bạn lãng phí mỗi năm và xem truyện tranh ngắn cực ý nghĩa!</p>
          <button 
            onClick={() => navigate('/food-waste-quiz')}
            style={{
              background: '#ffffff',
              color: '#1e3a8a',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '24px',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Chơi Quiz & Xem Truyện <ChevronRight size={16} />
          </button>
        </div>
        <div style={{ fontSize: '70px', zIndex: 1, opacity: 0.15, position: 'absolute', right: '20px', bottom: '-10px', pointerEvents: 'none' }}>
          🗑️🍏
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
                      <span className="badge badge-difficulty">{recipe.difficulty === "Easy" ? "Dễ" : recipe.difficulty === "Hard" ? "Khó" : recipe.difficulty || "Trung bình"}</span>
                      <span className="badge badge-time">{recipe.cookTime || 20} phút</span>
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
          <div className="sidebar-widget nutrition-widget-container" style={{ position: 'relative' }}>
            <div className="widget-title">
              <span>Dinh dưỡng</span>
              <span className="text-xs text-muted">Mục tiêu ngày</span>
            </div>
            
            {user?.plan === 'free' && (
              <div className="premium-lock-overlay" style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '15px',
                borderRadius: '16px',
                zIndex: 10
              }}>
                <div style={{ background: '#FFF5F5', padding: '10px', borderRadius: '50%', marginBottom: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                  <Flame size={28} className="text-red-500" />
                </div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>Theo dõi Calo & Đạm</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#6b7280', lineHeight: '1.4' }}>Tính năng cao cấp giúp kiểm soát dinh dưỡng tự động từ thực đơn của bạn.</p>
                <button 
                  onClick={() => navigate('/pricing')}
                  style={{
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)'
                  }}
                >
                  Nâng cấp Premium
                </button>
              </div>
            )}

            <div className="nutrition-stats">
              <div className="stat-item">
                <div className="stat-info">
                  <span className="stat-label">Calo</span>
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
                  <span className="stat-label">Đạm</span>
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
