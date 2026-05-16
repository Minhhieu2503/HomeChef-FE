import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllRecipes } from "../../services/recipeService";
import { authService } from "../../services/auth.service";
import { 
  Search, 
  Bell, 
  TrendingUp, 
  Clock, 
  Flame, 
  Star, 
  ChevronRight,
  Filter,
  Activity,
  Award
} from "lucide-react";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesRes, userRes] = await Promise.all([
          getAllRecipes(),
          authService.getMe()
        ]);
        setRecipes(recipesRes.recipes || []);
        setUser(userRes.data);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filters = [
    { id: "All", label: "Tất cả" },
    { id: "Lunch", label: "Bữa trưa" },
    { id: "Under 15 mins", label: "Dưới 15p" },
    { id: "Diet", label: "Eat Clean" },
    { id: "Quick", label: "Nhanh gọn" }
  ];

  return (
    <div className="dashboard">
      {/* 1. Mobile Custom Header */}
      <header className="mobile-top-bar">
        <div className="user-profile-v3" onClick={() => navigate("/profile")}>
          <div className="user-avatar-wrapper">
            <img 
              src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} 
              alt="Avatar" 
              className="user-avatar-main"
            />
            <div className="status-dot"></div>
          </div>
          <div className="ml-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chào buổi sáng</p>
            <h4 className="text-sm font-black text-slate-800">{user?.name?.split(' ')[0] || "Đầu bếp"} 👋</h4>
          </div>
        </div>

        <div className="nutrition-pill">
          <Activity size={14} className="text-green-500" />
          <span>85% Mục tiêu</span>
        </div>
      </header>

      {/* 2. Search Area */}
      <section className="mobile-search-area">
        <div className="search-box-v3">
          <Search size={20} className="text-slate-400" />
          <input type="text" placeholder="Tìm món ăn, nguyên liệu..." />
          <Filter size={18} className="text-slate-400" />
        </div>
      </section>

      {/* 3. Quick Filters */}
      <div className="quick-filters-v3">
        {filters.map(f => (
          <button 
            key={f.id} 
            className={`filter-chip ${activeFilter === f.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 4. Hero Banner */}
      <section className="hero-v3">
        <img 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800" 
          alt="Morning Inspiration" 
          className="hero-img"
        />
        <div className="hero-overlay">
          <h2>Morning Inspiration</h2>
          <div className="hero-meta">
            <span><Clock size={12} /> 20 phút</span>
            <span>•</span>
            <span>Healthy Breakfast</span>
          </div>
        </div>
      </section>

      {/* 5. Trending Recipes List */}
      <section className="trending-v3">
        <div className="trending-header-v3">
          <h3>Món ngon thịnh hành</h3>
          <Link to="/recipes" className="view-all-link">Xem tất cả</Link>
        </div>

        <div className="vertical-recipe-list">
          {loading ? (
            <div className="p-10 text-center text-slate-400 font-bold">Đang tìm món ngon...</div>
          ) : (
            recipes.slice(0, 5).map(recipe => (
              <div key={recipe._id} className="recipe-card-v3">
                <Link to={`/recipes/${recipe._id}`}>
                  <img src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"} alt={recipe.title} className="card-img-v3" />
                </Link>
                <div className="card-body-v3">
                  <div className="card-tags">
                    <span className="tag-v3">{recipe.difficulty || "Dễ"}</span>
                    {recipe.isPremium && <span className="tag-v3 flex items-center gap-1 bg-yellow-100 text-yellow-700"><Award size={10} /> Premium</span>}
                  </div>
                  <h4 translate="no">{recipe.title}</h4>
                  <div className="card-footer-v3">
                    <div className="flex gap-4">
                      <div className="rating-v3">
                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                        <span>4.8</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <Clock size={12} />
                        <span>{recipe.cookTime || 30}p</span>
                      </div>
                    </div>
                    <button className="btn-start-v3" onClick={() => navigate(`/recipes/${recipe._id}`)}>
                      Nấu ngay
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default Home;
