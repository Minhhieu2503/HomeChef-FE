import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMealPlans, addMealToPlan, removeMealFromPlan } from "../../services/mealPlanService";
import { authService } from "../../services/auth.service";
import { getAllRecipes } from "../../services/recipeService";
import { useToast } from "../../context/ToastContext";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Flame, 
  Star, 
  Trash2, 
  Calendar as CalendarIcon,
  Check,
  Search,
  Bell,
  AlertTriangle
} from "lucide-react";
import "./MealPlanner.css";

function MealPlanner({ isMobile }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [plannedMeals, setPlannedMeals] = useState({});
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [user, setUser] = useState(null);

  // Constants
  const slots = ["breakfast", "lunch", "dinner"];
  const dates = [
    { label: "Thứ 2", dayEn: "Monday", date: "12/05", id: 1 },
    { label: "Thứ 3", dayEn: "Tuesday", date: "13/05", id: 2 },
    { label: "Thứ 4", dayEn: "Wednesday", date: "14/05", id: 3 },
    { label: "Thứ 5", dayEn: "Thursday", date: "15/05", id: 4 },
    { label: "Thứ 6", dayEn: "Friday", date: "16/05", id: 5 },
    { label: "Thứ 7", dayEn: "Saturday", date: "17/05", id: 6 },
    { label: "CN", dayEn: "Sunday", date: "18/05", id: 7 },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener("resize", handleResize);
    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mealsRes, savedRes, recipesRes, userRes] = await Promise.all([
        getMealPlans(),
        getSavedRecipes(),
        getAllRecipes(),
        authService.getMe()
      ]);
      
      const mealMap = {};
      mealsRes.data.forEach(plan => {
        mealMap[`${plan.day}-${plan.slot}`] = plan.recipeId;
      });
      setPlannedMeals(mealMap);
      setSavedRecipes(savedRes.data || []);
      setAllRecipes(recipesRes.recipes || []);
      setUser(userRes.data);
    } catch (err) {
      console.error("Meal Planner fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async (day, slot, recipeId) => {
    try {
      await addMealToPlan({ day, slot, recipeId });
      toast.success("Đã thêm món ăn vào lịch trình!");
      fetchData();
    } catch (err) { toast.error("Lỗi khi thêm món ăn."); }
  };

  const handleRemoveMeal = async (day, slot) => {
    try {
      await removeMealFromPlan(day, slot);
      toast.success("Đã xóa món ăn khỏi lịch trình.");
      fetchData();
    } catch (err) { toast.error("Lỗi khi xóa món ăn."); }
  };

  const getSlotColor = (slot) => {
    switch (slot) {
      case 'breakfast': return '#fcd34d';
      case 'lunch': return '#4ade80';
      case 'dinner': return '#fb923c';
      default: return '#10b981';
    }
  };

  if (loading) return <div className="loading-screen">Đang tải lịch trình...</div>;

  const currentDayLabel = dates.find(d => d.id === selectedDay)?.dayEn;

  // --- MOBILE RENDERING ---
  if (isMobile) {
    return (
      <div className="meal-planner-v3 mobile-version">
        <header className="planner-header-v3">
          <button className="back-btn-v3" onClick={() => navigate('/')}><ChevronLeft size={24} /></button>
          <h2>Lịch trình ăn uống</h2>
          <button className="calendar-btn-v3"><CalendarIcon size={22} /></button>
        </header>

        <section className="date-picker-v3">
          {dates.map(d => (
            <div 
              key={d.id} 
              className={`date-capsule-v3 ${selectedDay === d.id ? 'active' : ''}`}
              onClick={() => setSelectedDay(d.id)}
            >
              <span className="day-label">{d.label}</span>
              <span className="date-number">{d.date.split('/')[0]}</span>
              {slots.some(s => plannedMeals[`${d.dayEn}-${s}`]) && <div className="dot-indicator"></div>}
            </div>
          ))}
        </section>

        <main className="meal-slots-v3">
          {slots.map(slot => {
            const recipe = plannedMeals[`${currentDayLabel}-${slot}`];
            const accentColor = getSlotColor(slot);

            return (
              <div key={slot} className="meal-slot-card-v3" style={{ borderLeft: `6px solid ${accentColor}` }}>
                <div className="slot-header-v3">
                  <span className="slot-title-v3" style={{ color: accentColor }}>
                    {slot === 'breakfast' ? 'Bữa sáng' : slot === 'lunch' ? 'Bữa trưa' : 'Bữa tối'}
                  </span>
                  {recipe && <button className="delete-btn-v3" onClick={() => handleRemoveMeal(currentDayLabel, slot)}><Trash2 size={16} /></button>}
                </div>

                {recipe ? (
                  <div className="recipe-mini-card-v3">
                    <img src={recipe.image} alt={recipe.title} className="recipe-thumb-v3" />
                    <div className="recipe-details-v3">
                      <h4>{recipe.title}</h4>
                      <div className="recipe-meta-v3">
                        <span><Clock size={12} /> {recipe.cookTime}p</span>
                        <span><Flame size={12} /> {recipe.calories} kcal</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button className="add-recipe-btn-v3" onClick={() => {
                    // Logic to open saved recipes sheet
                  }}>
                    <Plus size={20} />
                    <span>Lên thực đơn {slot === 'breakfast' ? 'sáng' : slot === 'lunch' ? 'trưa' : 'tối'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </main>

        <section className="saved-tray-v3">
          <div className="tray-header-v3">
            <h3>Món ăn đã lưu</h3>
            <button onClick={() => navigate('/recipes')}>Xem tất cả</button>
          </div>
          <div className="tray-scroll-v3">
            {savedRecipes.map(recipe => (
              <div key={recipe._id} className="tray-item-v3" onClick={() => handleAddMeal(currentDayLabel, "lunch", recipe._id)}>
                <img src={recipe.image} alt={recipe.title} />
                <span translate="no">{recipe.title}</span>
                <div className="add-overlay"><Plus size={20} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // --- DESKTOP RENDERING ---
  return (
    <div className="planner-v2-container desktop-version">
      <header className="planner-header">
        <h1 className="header-title">Lịch trình hàng tuần</h1>
        <div className="header-actions">
          <button className="notif-btn"><Bell size={20} /></button>
          <div className="user-profile" onClick={() => navigate('/profile')}>
            <img src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"} alt="Avatar" />
          </div>
        </div>
      </header>

      <div className="planner-grid">
        {dates.map(({ dayEn, date }) => {
          return (
            <div key={dayEn} className="grid-column">
              <div className="column-head">
                <span className="day-text">{dayEn}</span>
                <span className="date-text">{date}</span>
              </div>

              <div className="column-slots">
                 {slots.map(slot => {
                  const recipe = plannedMeals[`${dayEn}-${slot}`];
                  return (
                    <div key={slot} className="slot-item">
                      <span className="slot-name">BỮA {slot.toUpperCase()}</span>
                      {recipe ? (
                        <div className="meal-card">
                          <div className="meal-info">
                            <h5 translate="no">{recipe.title}</h5>
                            <p>{recipe.calories || 0} kcal</p>
                          </div>
                          <button className="remove-meal-btn" onClick={() => handleRemoveMeal(dayEn, slot)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="empty-slot" onClick={() => {
                          if (savedRecipes.length > 0) handleAddMeal(dayEn, slot, savedRecipes[0]._id);
                        }}>
                           <Plus size={20} className="plus-icon" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="planner-bottom">
        <div className="summary-widget">
          <h4>Tóm tắt hàng tuần</h4>
          <p>Dựa trên kế hoạch hiện tại, bạn sẽ tiêu thụ trung bình 1,850 kcal/ngày.</p>
          <button className="generate-btn" onClick={() => navigate('/shopping-list')}>
            Tạo danh sách mua sắm <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MealPlanner;
