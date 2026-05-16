import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllRecipes } from "../../services/recipeService";
import { authService } from "../../services/auth.service";
import { getMealPlan, scheduleMeal, unscheduleMeal } from "../../services/mealPlanService";
import { useToast } from "../../context/ToastContext";
import { Plus, Trash2, Search, Bell, AlertTriangle } from "lucide-react";
import "./MealPlanner.css";

const daysOfWeekEn = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const slots = ["Sáng", "Trưa", "Tối"];

// Map backend slot names to UI names
const slotMap = {
  "breakfast": "Sáng",
  "lunch": "Trưa",
  "dinner": "Tối",
  "sáng": "Sáng",
  "trưa": "Trưa",
  "tối": "Tối"
};

function MealPlanner() {
  const toast = useToast();
  const navigate = useNavigate();
  const [plannedMeals, setPlannedMeals] = useState({});
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectionModal, setSelectionModal] = useState({ show: false, day: null, slot: null, activeTab: 'saved' });
  const [dragOverTarget, setDragOverTarget] = useState(null); // { day, slot }

  const dates = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    monday.setDate(today.getDate() - currentDayIndex);
    
    return daysOfWeekEn.map((dayEn, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      
      // Fix: Use local date instead of UTC toISOString()
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const localIso = `${year}-${month}-${day}`;
      
      return { dayEn, date: d.getDate(), iso: localIso };
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const startIso = dates[0].iso;
        const endIso = dates[dates.length - 1].iso;

        const [me, recipesRes, savedRes, dbPlan] = await Promise.all([
          authService.getMe(),
          getAllRecipes(),
          authService.getSavedRecipes(),
          getMealPlan(startIso, endIso)
        ]);

        setUser(me.data);

        const recipesArr = Array.isArray(recipesRes) ? recipesRes : (recipesRes?.recipes || []);
        setAllRecipes(recipesArr);

        setSavedRecipes(savedRes.data || []);

        const normalized = {};
        const planData = dbPlan?.data || (Array.isArray(dbPlan) ? dbPlan : []);
        
        planData.forEach(node => {
          if (!node || !node.date || !node.recipe) return;
          const dayObj = dates.find(d => d.iso === node.date);
          if (dayObj) {
            const slotKey = slotMap[node.slot.toLowerCase()] || node.slot;
            normalized[`${dayObj.dayEn}-${slotKey}`] = {
              dbId: node._id,
              recipeId: node.recipe._id,
              title: node.recipe.title,
              cal: node.recipe.calories || 0,
              img: node.recipe.image
            };
          }
        });
        setPlannedMeals(normalized);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRemoveMeal = async (compositeKey) => {
    const node = plannedMeals[compositeKey];
    if (!node || !node.dbId) return;

    try {
      await unscheduleMeal(node.dbId);
      setPlannedMeals(prev => {
        const copy = { ...prev };
        delete copy[compositeKey];
        return copy;
      });
      toast.info("Đã gỡ món khỏi lịch.");
    } catch (err) {
      toast.error("Lỗi xóa món ăn.");
    }
  };

  const handleAddMeal = (dayEn, slot) => {
    setSelectionModal({ show: true, day: dayEn, slot, activeTab: 'saved' });
  };

  const confirmAddMeal = async (recipe) => {
    const dayObj = dates.find(d => d.dayEn === selectionModal.day);
    if (!dayObj) return;

    const compositeKey = `${selectionModal.day}-${selectionModal.slot}`;
    const previousState = { ...plannedMeals };

    // Optimistic Update
    setPlannedMeals(prev => ({
      ...prev,
      [compositeKey]: {
        dbId: 'temp-' + Date.now(), // Temporary ID
        recipeId: recipe._id,
        title: recipe.title,
        cal: recipe.calories || 0,
        img: recipe.image
      }
    }));

    setSelectionModal({ show: false, day: null, slot: null });

    try {
      const backendSlot = selectionModal.slot === "Sáng" ? "breakfast" : 
                         selectionModal.slot === "Trưa" ? "lunch" : "dinner";

      const response = await scheduleMeal(
        dayObj.iso,
        backendSlot,
        recipe._id
      );

      const node = response.data || response;
      
      // Update with real DB ID
      setPlannedMeals(prev => ({
        ...prev,
        [compositeKey]: {
          ...prev[compositeKey],
          dbId: node._id
        }
      }));

      toast.success(`Đã lên lịch ${recipe.title}`);
    } catch (err) {
      console.error(err);
      // Rollback on error
      setPlannedMeals(previousState);
      toast.error("Lỗi khi cập nhật lịch ăn.");
    }
  };

  const handleDrop = async (e, dayEn, slot) => {
    e.preventDefault();
    setDragOverTarget(null);
    
    const recipeId = e.dataTransfer.getData("recipeId");
    if (!recipeId) return;

    const recipe = {
      _id: recipeId,
      title: e.dataTransfer.getData("recipeTitle"),
      calories: e.dataTransfer.getData("recipeCal"),
      image: e.dataTransfer.getData("recipeImg")
    };

    const dayObj = dates.find(d => d.dayEn === dayEn);
    if (!dayObj) return;

    const compositeKey = `${dayEn}-${slot}`;
    const previousState = { ...plannedMeals };

    // Optimistic Update
    setPlannedMeals(prev => ({
      ...prev,
      [compositeKey]: {
        dbId: 'temp-' + Date.now(),
        recipeId: recipe._id,
        title: recipe.title,
        cal: recipe.calories || 0,
        img: recipe.image
      }
    }));

    try {
      const backendSlot = slot === "Sáng" ? "breakfast" : 
                         slot === "Trưa" ? "lunch" : "dinner";

      const response = await scheduleMeal(dayObj.iso, backendSlot, recipe._id);
      const node = response.data || response;
      
      // Update with real DB ID
      setPlannedMeals(prev => ({
        ...prev,
        [compositeKey]: {
          ...prev[compositeKey],
          dbId: node._id
        }
      }));
      
      toast.success(`Đã lên lịch ${recipe.title}`);
    } catch (err) {
      console.error(err);
      // Rollback on error
      setPlannedMeals(previousState);
      toast.error("Lỗi khi kéo thả món ăn.");
    }
  };

  const parseCalories = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const num = parseInt(val.replace(/[^0-9]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const dailyTotals = useMemo(() => {
    const totals = {};
    dates.forEach(({ dayEn }) => {
      totals[dayEn] = slots.reduce((acc, slot) => {
        const meal = plannedMeals[`${dayEn}-${slot}`];
        const cals = parseCalories(meal?.cal);
        return acc + cals;
      }, 0);
    });
    return totals;
  }, [plannedMeals, dates]);

  const weeklyStats = useMemo(() => {
    const totalCals = Object.values(plannedMeals).reduce((acc, m) => acc + parseCalories(m?.cal), 0);
    const count = Object.keys(plannedMeals).length;
    const avg = Math.round(totalCals / 7);
    return { totalCals, count, avg };
  }, [plannedMeals]);

  if (loading) {
    return <div className="loading-screen">Đang tải lịch trình...</div>;
  }

  return (
    <div className="planner-v2-container">
      {/* Header */}
      <header className="planner-header">
        <h1 className="header-title">Lịch trình hàng tuần</h1>
        <div className="header-actions">
          <button className="notif-btn"><Bell size={20} /></button>
          <div className="user-profile" onClick={() => navigate('/profile')}>
            <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Avatar" />
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="planner-grid">
        {dates.map(({ dayEn, date }) => {
          const dailyCals = dailyTotals[dayEn];
          const isExceeded = dailyCals > 3000;

          return (
            <div key={dayEn} className="grid-column">
              <div className="column-head">
                <span className="day-text">{dayEn}</span>
                <span className="date-text">{date}</span>
              </div>

              <div className="column-slots">
                 {slots.map(slot => {
                  const meal = plannedMeals[`${dayEn}-${slot}`];
                  const isDragTarget = dragOverTarget?.day === dayEn && dragOverTarget?.slot === slot;

                  return (
                    <div 
                      key={slot} 
                      className={`slot-item ${isDragTarget ? 'drag-over' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!meal) setDragOverTarget({ day: dayEn, slot });
                      }}
                      onDragLeave={() => setDragOverTarget(null)}
                      onDrop={(e) => handleDrop(e, dayEn, slot)}
                    >
                      <span className="slot-name">BỮA {slot.toUpperCase()}</span>
                      {meal ? (
                        <div className="meal-card">
                          <div className="meal-info">
                            <h5>{meal.title}</h5>
                            <p>{meal.cal} kcal</p>
                          </div>
                          <button className="remove-meal-btn" onClick={() => handleRemoveMeal(`${dayEn}-${slot}`)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="empty-slot" onClick={() => handleAddMeal(dayEn, slot)}>
                           <Plus size={20} className="plus-icon" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="column-foot">
                <span className="foot-label">Daily Total</span>
                <div className={`total-value ${isExceeded ? 'warn' : ''}`}>
                   {dailyCals} <span className="unit">kcal</span>
                </div>
                {isExceeded && (
                  <div className="warn-text">
                    <AlertTriangle size={12} /> LIMIT EXCEEDED
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Widgets */}
      <div className="planner-bottom">
        <div className="chef-choice-widget" style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), transparent), url('https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800')` }}>
          <div className="widget-content">
            <span className="badge">LỰA CHỌN CỦA ĐẦU BẾP</span>
            <h3>Bữa tiệc cuối tuần: Thịt cừu nướng chậm</h3>
            <p>Thích hợp cho buổi họp mặt gia đình Chủ nhật. Giàu protein và sắt, chỉ cần chuẩn bị rất ít thời gian.</p>
          </div>
        </div>

        <div className="summary-widget">
          <div className="summary-content">
            <h4>Tóm tắt hàng tuần</h4>
            <p>
              Bạn đã lên kế hoạch cho <strong>{weeklyStats.count}/21</strong> bữa ăn.<br />
              Tổng cộng: <strong>{weeklyStats.totalCals} kcal</strong> (Trung bình <strong>{weeklyStats.avg} kcal/ngày</strong>).
            </p>
          </div>
          <button className="generate-btn" onClick={() => navigate('/shopping-list')}>
            Tạo danh sách mua sắm <Plus size={18} className="btn-plus" />
          </button>
          <div className="fab-add" onClick={() => {
            // Find first empty slot and open modal
            for (const d of dates) {
              for (const s of slots) {
                if (!plannedMeals[`${d.dayEn}-${s}`]) {
                  handleAddMeal(d.dayEn, s);
                  return;
                }
              }
            }
            toast.info("Lịch tuần này đã đầy!");
          }}>+</div>
        </div>
      </div>

      {/* Selection Modal */}
      {selectionModal.show && (
        <div className="planner-modal-overlay" onClick={() => setSelectionModal({ show: false, day: null, slot: null })}>
          <div className="planner-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-top">
                <h4>Chọn món cho {selectionModal.day} - {selectionModal.slot}</h4>
                <button className="close-btn" onClick={() => setSelectionModal({ show: false, day: null, slot: null })}><Plus style={{transform: 'rotate(45deg)'}} /></button>
              </div>
              <div className="modal-tabs">
                <button 
                  className={`modal-tab ${selectionModal.activeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setSelectionModal(prev => ({ ...prev, activeTab: 'saved' }))}
                >
                  Khay món ăn ({savedRecipes.length})
                </button>
                <button 
                  className={`modal-tab ${selectionModal.activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectionModal(prev => ({ ...prev, activeTab: 'all' }))}
                >
                  Tất cả công thức
                </button>
              </div>
            </div>
            <div className="modal-recipe-grid">
              {(selectionModal.activeTab === 'saved' ? savedRecipes : allRecipes).map(recipe => (
                <div key={recipe._id} className="modal-recipe-item" onClick={() => confirmAddMeal(recipe)}>
                  <img src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200"} alt={recipe.title} />
                  <div className="item-info">
                    <h5>{recipe.title}</h5>
                    <p>{recipe.calories || 0} kcal</p>
                  </div>
                </div>
              ))}
              {selectionModal.activeTab === 'saved' && savedRecipes.length === 0 && (
                <div className="empty-modal-state">
                  <p>Khay món ăn của bạn đang trống.</p>
                  <button onClick={() => navigate('/recipes')}>Đi lưu công thức ngay</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealPlanner;
