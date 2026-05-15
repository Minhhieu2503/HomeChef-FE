import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { getAllRecipes } from "../../services/recipeService";
import { Search, Filter, Heart, Clock, Star, ChevronRight, SlidersHorizontal } from "lucide-react";
import "./Recipes.css";

function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [user, setUser] = useState(null);

  // Filter States
  const [prepTime, setPrepTime] = useState(120);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const me = await authService.getMe();
        setUser(me.data);

        const response = await getAllRecipes();
        let data = response?.recipes || (Array.isArray(response) ? response : []);

        // Mocking tags for demo purposes so filters work
        data = data.map((r, index) => {
          const title = r.title.toLowerCase();
          let tags = ["Gluten-free"];

          if (title.includes("salad") || title.includes("chay") || title.includes("rau")) {
            tags.push("Vegan");
          }
          if (title.includes("gym") || title.includes("ức gà") || title.includes("keto")) {
            tags.push("Keto", "Low Carb");
          }
          if (index % 5 === 0) tags.push("Paleo");

          return {
            ...r,
            difficulty: r.difficulty || (index % 3 === 0 ? "Easy" : index % 3 === 1 ? "Medium" : "Hard"),
            dietaryTags: r.dietaryTags?.length > 0 ? r.dietaryTags : tags
          };
        });

        setRecipes(data);
        setFilteredRecipes(data); // Initial display
      } catch (err) {
        console.error("Failed to load recipes", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedDiets, selectedDifficulty, prepTime, searchQuery]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);

    if (value.trim().length > 0) {
      const q = value.toLowerCase();
      const matches = recipes
        .filter(r => r.title.toLowerCase().includes(q))
        .slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (recipe) => {
    setSearchQuery(recipe.title);
    setSuggestions([]);
  };

  const applyFilters = () => {
    let result = [...recipes];
    const q = searchQuery.toLowerCase();

    // 1. Search Query
    if (q) {
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.toLowerCase().includes(q))
      );
    }

    // 2. Prep Time
    result = result.filter(r => (r.cookTime || 20) <= prepTime);

    // 3. Difficulty
    if (selectedDifficulty.length > 0) {
      result = result.filter(r => {
        const level = r.difficulty || "Medium";
        return selectedDifficulty.includes(level);
      });
    }

    // 4. Dietary
    if (selectedDiets.length > 0) {
      result = result.filter(r => {
        const tags = r.dietaryTags || [];
        return selectedDiets.some(sd => tags.includes(sd));
      });
    }

    setFilteredRecipes(result);
  };

  const handleToggleSave = async (e, recipeId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await authService.toggleSavedRecipe(recipeId);
      if (res.data) {
        setUser(prev => ({
          ...prev,
          savedRecipes: res.data
        }));
      }
    } catch (err) {
      console.error("Failed to toggle save", err);
    }
  };

  const isSaved = (recipeId) => {
    return user?.savedRecipes?.includes(recipeId);
  };

  const handleDietToggle = (diet) => {
    setSelectedDiets(prev =>
      prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]
    );
  };

  const handleDifficultyToggle = (level) => {
    setSelectedDifficulty(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const categories = [
    { title: "Bữa sáng", type: "breakfast" },
    { title: "Món chính", type: "main" },
    { title: "Món khai vị", type: "appetizer" },
    { title: "Món tráng miệng", type: "dessert" },
    { title: "Đồ uống", type: "drink" },
    { title: "Món chay", type: "vegetarian" },
    { title: "Healthy", type: "healthy" },
    { title: "Súp & Canh", type: "soup" },
    { title: "Salad", type: "salad" },
    { title: "Ăn vặt", type: "snack" }
  ];

  const recipeOfDay = recipes[0] || null;

  return (
    <div className="recipe-discovery">
      {/* 1. Main Content Area */}
      <main className="discovery-main">
        {/* Search Bar */}
        <div className="discovery-search-wrapper">
          <form className="smart-search discovery-search-form" onSubmit={(e) => { e.preventDefault(); applyFilters(); }}>
            <Search size={20} className="text-muted" />
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Tìm kiếm công thức"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery && handleSearchChange(searchQuery)}
              />
              {suggestions.length > 0 && (
                <ul className="search-suggestions">
                  {suggestions.map(r => (
                    <li key={r._id} onClick={() => handleSuggestionClick(r)}>
                      <Search size={14} />
                      <span translate="no">{r.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button type="submit" className="btn-search-header">Tìm</button>
          </form>
        </div>

        {/* Recipe of the Day Banner */}
        {recipeOfDay && (
          <section className="recipe-of-day-banner">
            <img src={recipeOfDay.image || "https://i-giadinh.vnecdn.net/2023/04/16/Buoc-11-Thanh-pham-11-7068-1681636164.jpg"} alt={recipeOfDay.title} />
            <div className="banner-content">
              <span className="banner-badge">Gợi ý hôm nay</span>
              <h2 translate="no">{recipeOfDay.title}</h2>
              <div className="nutrient-summary">
                <div className="nutrient-item">
                  <span className="label">Calo</span>
                  <span className="value">{recipeOfDay.calories || 450} kcal</span>
                </div>
                <div className="nutrient-item">
                  <span className="label">Đạm</span>
                  <span className="value">{recipeOfDay.protein || 24}g</span>
                </div>
                <div className="nutrient-item">
                  <span className="label">Chất béo</span>
                  <span className="value">{recipeOfDay.fat || 12}g</span>
                </div>
              </div>
              <Link to={`/recipes/${recipeOfDay._id}`} className="btn-view-plan mt-6 w-fit">
                Bắt đầu nấu ngay
              </Link>
            </div>
          </section>
        )}

        {/* All Recipes Grid */}
        <section className="category-section all-recipes-section">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold" translate="no">Tất cả công thức</h3>
            <span className="text-muted text-sm">{filteredRecipes.length} món ăn</span>
          </div>
          <div className="recipes-grid-discovery">
            {filteredRecipes.map(recipe => (
              <div key={recipe._id} className="recipe-card-discovery">
                <div className="card-image-discovery">
                  <img src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"} alt={recipe.title} />
                  {recipe.rating > 4.8 && <span className="status-badge" style={{ zIndex: 20 }}>Popular</span>}
                  <button 
                    className={`favorite-btn ${isSaved(recipe._id) ? 'active' : ''}`} 
                    style={{ zIndex: 20 }}
                    onClick={(e) => handleToggleSave(e, recipe._id)}
                  >
                    <Heart size={18} fill={isSaved(recipe._id) ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="card-content-discovery">
                  <h4 translate="no">{recipe.title}</h4>
                  <div className="card-meta-discovery">
                    <span className="flex items-center gap-1"><Clock size={14} /> {recipe.cookTime || 20} min</span>
                    <span className="flex items-center gap-1 text-yellow-500"><Star size={14} fill="currentColor" /> {recipe.rating || 4.9}</span>
                  </div>
                </div>
                <Link to={`/recipes/${recipe._id}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}></Link>
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider"></div>

        {/* Category Carousels */}
        {categories.map(cat => {
          const categoryRecipes = filteredRecipes.filter(r => r.category === cat.type);
          if (categoryRecipes.length === 0) return null;

          return (
            <section key={cat.type} className="category-section">
              <h3 translate="no">
                {cat.title}
                <Link to={`/recipes?category=${cat.type}`} className="text-sm text-primary flex items-center gap-1">
                  Xem thêm <ChevronRight size={16} />
                </Link>
              </h3>
              <div className="carousel-container">
                {categoryRecipes.map(recipe => (
                  <div key={recipe._id} className="recipe-card-discovery">
                    <div className="card-image-discovery">
                      <img src={recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600"} alt={recipe.title} />
                      {recipe.rating > 4.8 && <span className="status-badge" style={{ zIndex: 20 }}>Popular</span>}
                      <button 
                        className={`favorite-btn ${isSaved(recipe._id) ? 'active' : ''}`} 
                        style={{ zIndex: 20 }}
                        onClick={(e) => handleToggleSave(e, recipe._id)}
                      >
                        <Heart size={18} fill={isSaved(recipe._id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="card-content-discovery">
                      <h4 translate="no">{recipe.title}</h4>
                      <div className="card-meta-discovery">
                        <span className="flex items-center gap-1"><Clock size={14} /> {recipe.cookTime || 20} min</span>
                        <span className="flex items-center gap-1 text-yellow-500"><Star size={14} fill="currentColor" /> {recipe.rating || 4.9}</span>
                      </div>
                    </div>
                    <Link to={`/recipes/${recipe._id}`} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}></Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {filteredRecipes.length === 0 && !loading && (
          <div className="empty-results">
            <Filter size={48} className="text-muted mb-4" />
            <p>Không tìm thấy công thức nào phù hợp với bộ lọc của bạn.</p>
            <button className="text-primary font-bold mt-2" onClick={() => {
              setSearchQuery("");
              setPrepTime(120);
              setSelectedDiets([]);
              setSelectedDifficulty([]);
              setFilteredRecipes(recipes);
            }}>Xóa tất cả bộ lọc</button>
          </div>
        )}
      </main>

      {/* 2. Filter Sidebar (Right) */}
      <aside className="filter-sidebar">
        <div className="flex items-center gap-2 mb-6">
          <SlidersHorizontal size={20} className="text-primary" />
          <h3 className="text-lg font-bold" translate="no">Bộ lọc nâng cao</h3>
        </div>

        <div className="filter-group">
          <h4 translate="no">Chế độ ăn</h4>
          <div className="filter-options">
            {[
              { id: "Vegan", label: "Thuần chay" },
              { id: "Keto", label: "Chế độ ăn Keto" },
              { id: "Gluten-free", label: "Không chứa gluten" },
              { id: "Low Carb", label: "Ít tinh bột" },
              { id: "Paleo", label: "Paleo" }
            ].map(diet => (
              <label key={diet.id} className="checkbox-label" translate="no">
                <input
                  type="checkbox"
                  checked={selectedDiets.includes(diet.id)}
                  onChange={() => handleDietToggle(diet.id)}
                />
                {diet.label}
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4 translate="no">Thời gian chuẩn bị</h4>
          <div className="range-slider-group">
            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={prepTime}
              onChange={(e) => setPrepTime(Number(e.target.value))}
            />
            <div className="range-values" translate="no">
              <span>5 phút</span>
              <span className="text-primary font-bold">{prepTime} phút</span>
              <span>120 phút</span>
            </div>
          </div>
        </div>

        <div className="filter-group">
          <h4 translate="no">Độ khó</h4>
          <div className="filter-options">
            {[
              { id: "Easy", label: "Dễ" },
              { id: "Medium", label: "Trung bình" },
              { id: "Hard", label: "Khó" }
            ].map(level => (
              <label key={level.id} className="checkbox-label" translate="no">
                <input
                  type="checkbox"
                  checked={selectedDifficulty.includes(level.id)}
                  onChange={() => handleDifficultyToggle(level.id)}
                />
                {level.label}
              </label>
            ))}
          </div>
        </div>

        <button className="btn-view-plan w-full mt-auto" onClick={applyFilters} translate="no">
          Áp dụng bộ lọc
        </button>
      </aside>
    </div>
  );
}

export default Recipes;
