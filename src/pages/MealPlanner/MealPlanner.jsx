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
  Bell,
  CheckCircle2
} from "lucide-react";
import "./MealPlanner.css";

function MealPlanner({ isMobile }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [plannedMeals, setPlannedMeals] = useState({});
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 7);
  const [user, setUser] = useState(null);

  const slots = [
    { id: "breakfast", label: "Bữa sáng", color: "#fbbf24" },
    { id: "lunch", label: "Bữa trưa", color: "#10b981" },
    { id: "dinner", label: "Bữa tối", color: "#f97316" }
  ];

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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const start = new Date();
      start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const [mealsRes, savedRes, userRes] = await Promise.all([
        getMealPlans(start.toISOString(), end.toISOString()),
        authService.getSavedRecipes(),
        authService.getMe()
      ]);
      
      const mealMap = {};
      if (mealsRes.data) {
        mealsRes.data.forEach(plan => {
          const dateObj = new Date(plan.date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
          mealMap[`${dayName}-${plan.slot}`] = plan.recipe;
        });
      }
      
      setPlannedMeals(mealMap);
      setSavedRecipes(savedRes.data || []);
      setUser(userRes.data);
    } catch (err) {
      console.error("Meal Planner fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async (dayEn, slot, recipeId) => {
    try {
      const targetDate = new Date();
      // Logic would normally find the exact date for dayEn
      await addMealToPlan({ date: targetDate.toISOString(), slot, recipeId });
      toast.success("Đã thêm món!");
      fetchData();
    } catch (err) { toast.error("Lỗi thêm món."); }
  };

  const handleRemove = async (dayEn, slot) => {
    toast.info("Chức năng xóa đang cập nhật");
  };

  const currentDay = dates.find(d => d.id === selectedDay);

  if (loading) return <div className="p-20 text-center">Đang tải lịch trình...</div>;

  if (isMobile) {
    return (
      <div className="meal-planner-v3 mobile-version">
        <header className="planner-header-v3">
          <button className="icon-btn" onClick={() => navigate('/')}><ChevronLeft /></button>
          <h2 translate="no">Lịch trình ăn uống</h2>
          <button className="icon-btn"><CalendarIcon /></button>
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
            </div>
          ))}
        </section>

        <main className="meal-slots-v3">
          {slots.map(slot => {
            const recipe = plannedMeals[`${currentDay.dayEn}-${slot.id}`];
            return (
              <div key={slot.id} className="meal-slot-card-v3" style={{ borderLeft: `8px solid ${slot.color}` }}>
                <div className="slot-header-v3">
                  <span className="slot-title-v3" style={{ color: slot.color }} translate="no">{slot.label}</span>
                  {recipe && <button onClick={() => handleRemove(currentDay.dayEn, slot.id)}><Trash2 size={18} /></button>}
                </div>

                {recipe ? (
                  <div className="recipe-mini-card-v3">
                    <img src={recipe.image} alt={recipe.title} className="recipe-thumb-v3" />
                    <div className="recipe-details-v3">
                      <h4 translate="no">{recipe.title}</h4>
                      <div className="recipe-meta-v3">
                        <span><Clock size={14} /> {recipe.cookTime}p</span>
                        <span><Flame size={14} /> {recipe.calories} kcal</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button className="add-recipe-btn-v3" onClick={() => {}}>
                    <Plus size={24} />
                    <span translate="no">Thêm {slot.label.toLowerCase()}</span>
                  </button>
                )}
              </div>
            );
          })}
        </main>

        <section className="saved-tray-v3">
          <div className="tray-header-v3"><h3>Món ăn đã lưu</h3></div>
          <div className="tray-scroll-v3">
            {savedRecipes.map(r => (
              <div key={r._id} className="tray-item-v3" onClick={() => handleAddMeal(currentDay.dayEn, "lunch", r._id)}>
                <img src={r.image} alt={r.title} />
                <span translate="no">{r.title}</span>
                <div className="add-overlay"><Plus size={16} /></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // --- DESKTOP GRID VIEW (RESTORED) ---
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
        {dates.map(({ dayEn, label, date }) => {
          return (
            <div key={dayEn} className="grid-column">
              <div className="column-head">
                <span className="day-text">{label}</span>
                <span className="date-text">{date}</span>
              </div>

              <div className="column-slots">
                 {slots.map(slot => {
                  const recipe = plannedMeals[`${dayEn}-${slot.id}`];
                  return (
                    <div key={slot.id} className="slot-item">
                      <span className="slot-name">BỮA {slot.id.toUpperCase()}</span>
                      {recipe ? (
                        <div className="meal-card">
                          <div className="meal-info">
                            <h5 translate="no">{recipe.title}</h5>
                            <p>{recipe.calories || 0} kcal</p>
                          </div>
                          <button className="remove-meal-btn" onClick={() => handleRemove(dayEn, slot.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="empty-slot" onClick={() => {
                          if (savedRecipes.length > 0) handleAddMeal(dayEn, slot.id, savedRecipes[0]._id);
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
