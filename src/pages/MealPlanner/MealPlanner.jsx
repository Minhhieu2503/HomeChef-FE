import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAllRecipes } from "../../services/recipeService";
import { authService } from "../../services/auth.service";
import { getMealPlan, scheduleMeal, unscheduleMeal } from "../../services/mealPlanService";
import { useToast } from "../../context/ToastContext";
import { Plus, Trash2, Search, Bell, AlertTriangle, Settings, GripVertical, MoreVertical, ChevronUp, Flame, Clock } from "lucide-react";
import "./MealPlanner.css";

const daysOfWeekVi = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const slots = ["breakfast", "lunch", "dinner"];

const slotLabels = {
  "breakfast": "Bữa Sáng",
  "lunch": "Bữa Trưa",
  "dinner": "Bữa Tối"
};

const slotMap = {
  "breakfast": "breakfast",
  "lunch": "lunch",
  "dinner": "dinner",
  "sáng": "breakfast",
  "trưa": "lunch",
  "tối": "dinner"
};

function MealPlanner() {
  const toast = useToast();
  const navigate = useNavigate();
  const [plannedMeals, setPlannedMeals] = useState({});
  const [selectedDay, setSelectedDay] = useState(0); 
  const [showSavedSheet, setShowSavedSheet] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null); 
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [allRecipes, setAllRecipes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectionModal, setSelectionModal] = useState({ show: false, day: null, slot: null });

  const dates = useMemo(() => {
    const today = new Date();
    const monday = new Date(today);
    const currentDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
    monday.setDate(today.getDate() - currentDayIndex);
    
    return daysOfWeekVi.map((dayVi, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const localIso = `${year}-${month}-${day}`;
      
      return { dayVi, date: d.getDate(), iso: localIso };
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const me = await authService.getMe();
        setUser(me.data);

        const recipesRes = await getAllRecipes();
        const recipesArr = Array.isArray(recipesRes) ? recipesRes : (recipesRes?.recipes || []);
        setAllRecipes(recipesArr);

        const savedRes = await authService.getSavedRecipes();
        setSavedRecipes(savedRes.data || []);

        const startIso = dates[0].iso;
        const endIso = dates[dates.length - 1].iso;
        const dbPlan = await getMealPlan(startIso, endIso);
        
        const normalized = {};
        const planData = dbPlan?.data || (Array.isArray(dbPlan) ? dbPlan : []);
        
        planData.forEach(node => {
          if (!node || !node.date || !node.recipe) return;
          const dayObj = dates.find(d => d.iso === node.date);
          if (dayObj) {
            const slotKey = slotMap[node.slot.toLowerCase()] || node.slot;
            normalized[`${dayObj.dayVi}-${slotKey}`] = {
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
  }, [dates]);

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

  const confirmAddMeal = async (recipe) => {
    const targetDay = selectionModal.day || dates[selectedDay].dayVi;
    const targetSlot = selectionModal.slot || 'lunch';
    
    const dayObj = dates.find(d => d.dayVi === targetDay);
    if (!dayObj) return;

    const compositeKey = `${targetDay}-${targetSlot}`;
    const previousState = { ...plannedMeals };

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
      const response = await scheduleMeal(dayObj.iso, targetSlot, recipe._id);
      const node = response.data || response;
      setPlannedMeals(prev => ({
        ...prev,
        [compositeKey]: { ...prev[compositeKey], dbId: node._id }
      }));
      toast.success(`Đã lên lịch ${recipe.title}`);
    } catch (err) {
      setPlannedMeals(previousState);
      toast.error("Lỗi khi cập nhật lịch ăn.");
    }
  };

  if (loading) {
    return <div className="loading-screen">Đang tải lịch trình...</div>;
  }

  return (
    <div className="planner-premium-container">
      {/* 1. App Header */}
      <div className="planner-app-header">
        <h1 className="brand-text">HomeChef</h1>
        <div className="header-icons">
          <button className="icon-btn"><Bell size={22} /></button>
          <button className="icon-btn"><Settings size={22} /></button>
        </div>
      </div>

      {/* 2. Horizontal Date Picker */}
      <div className="premium-date-picker">
        {dates.map((d, i) => (
          <div 
            key={d.dayVi} 
            className={`date-capsule ${selectedDay === i ? 'active' : ''}`}
            onClick={() => setSelectedDay(i)}
          >
            <span className="day-name">{d.dayVi}</span>
            <span className="date-num">{d.date}</span>
            {(plannedMeals[`${d.dayVi}-breakfast`] || plannedMeals[`${d.dayVi}-lunch`] || plannedMeals[`${d.dayVi}-dinner`]) && (
              <div className="has-meal-dot"></div>
            )}
          </div>
        ))}
      </div>

      {/* 3. Daily View */}
      <div className="daily-view-premium">
        <div className="view-section-header">
          <h3>{dates[selectedDay].dayVi} Plan</h3>
          <button className="add-custom-btn" onClick={() => setShowSavedSheet(true)}>
            <Plus size={18} /> Add Custom
          </button>
        </div>

        <div className="meal-stack-premium">
          {slots.map(slot => {
            const dayVi = dates[selectedDay].dayVi;
            const meal = plannedMeals[`${dayVi}-${slot}`];

            return (
              <div key={slot} className={`meal-card-premium slot-${slot}`} onClick={() => { setSelectionModal({ show: false, day: dayVi, slot: slot }); setShowSavedSheet(true); }}>
                <div className="meal-card-inner">
                  <div className="meal-img-container">
                    <img src={meal?.img || "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200"} alt={meal?.title} />
                  </div>
                  <div className="meal-details">
                    <div className="slot-header">
                      <span className="slot-type">{slotLabels[slot].toUpperCase()}</span>
                      <GripVertical size={14} className="drag-handle" />
                    </div>
                    {meal ? (
                      <>
                        <h4>{meal.title}</h4>
                        <div className="meal-metrics">
                          <span>{meal.cal} kcal</span>
                          <span className="dot"></span>
                          <span>15 mins</span>
                        </div>
                      </>
                    ) : (
                      <div className="empty-slot-text">Chưa có món ăn</div>
                    )}
                  </div>
                  <button className="more-btn" onClick={(e) => { e.stopPropagation(); if(meal) handleRemoveMeal(`${dayVi}-${slot}`); }}>
                    {meal ? <Trash2 size={18} /> : <MoreVertical size={20} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Sheet (Saved Recipes) */}
      <div className={`saved-sheet-premium ${showSavedSheet ? 'open' : ''}`}>
        <div className="sheet-backdrop" onClick={() => setShowSavedSheet(false)}></div>
        <div className="sheet-content-premium">
          <div className="sheet-handle"></div>
          <div className="sheet-header">
            <h4>Saved Recipes</h4>
            <ChevronUp size={20} className="arrow" />
          </div>
          <div className="horizontal-recipe-list">
            {savedRecipes.length > 0 ? (
              savedRecipes.map(recipe => (
                <div key={recipe._id} className="recipe-bubble-item" onClick={() => {
                  confirmAddMeal(recipe);
                  setShowSavedSheet(false);
                }}>
                  <img src={recipe.image} alt={recipe.title} />
                  <span>{recipe.title}</span>
                </div>
              ))
            ) : (
              <div className="empty-saved-mini">Bạn chưa lưu món nào</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MealPlanner;
