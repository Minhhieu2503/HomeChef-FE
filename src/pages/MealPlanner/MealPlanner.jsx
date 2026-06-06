import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { getAllRecipes } from "../../services/recipeService";
import { authService } from "../../services/auth.service";
import { getMealPlan, scheduleMeal, unscheduleMeal, generateAIMealPlan } from "../../services/mealPlanService";
import { useToast } from "../../context/ToastContext";
import { Plus, Trash2, Search, Bell, AlertTriangle, Sparkles, Loader, Check, X, ChevronRight, CheckCircle2 } from "lucide-react";
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
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [aiForm, setAiForm] = useState({ peopleCount: 2, daysCount: 3, dietMode: "balanced", prioritizePantry: true });

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunAI = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await generateAIMealPlan({
        peopleCount: aiForm.peopleCount,
        daysCount: aiForm.daysCount,
        dietMode: aiForm.dietMode,
        prioritizePantry: aiForm.prioritizePantry
      });

      toast.success("Đã tạo thành công kế hoạch ăn uống bằng AI! 🎉");
      setIsAIModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("AI Planner Error:", err);
      toast.error(err.response?.data?.message || "Không thể khởi tạo kế hoạch ăn uống bằng AI. Vui lòng nâng cấp Premium hoặc thử lại!");
    } finally {
      setIsGenerating(false);
    }
  };

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
    <div className={`planner-v2-container ${Capacitor.isNativePlatform() ? "mobile-planner" : ""}`}>
      {/* 1. Header (Mobile vs Web) */}
      {!Capacitor.isNativePlatform() ? (
        <header className="planner-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 className="header-title">Lịch trình hàng tuần</h1>
            <button 
              className="btn-ai-planner" 
              onClick={() => setIsAIModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={15} /> Lên Kế Hoạch AI
            </button>
          </div>
          <div className="header-actions">
            <button className="notif-btn"><Bell size={20} /></button>
            <div className="user-profile" onClick={() => navigate('/profile')}>
              <img src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Avatar" />
            </div>
          </div>
        </header>
      ) : (
        <header className="mobile-planner-header">
          <div className="planner-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h2>Meal Planner</h2>
              <div className="planner-summary">
                <span className={weeklyStats.totalCals > 15000 ? 'warn' : ''}>
                  {weeklyStats.totalCals.toLocaleString()} kcal this week
                </span>
              </div>
            </div>
            <button 
              className="btn-mobile-ai-planner" 
              onClick={() => setIsAIModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '16px',
                fontWeight: 'bold',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 8px rgba(16, 185, 129, 0.2)'
              }}
            >
              <Sparkles size={12} /> AI Plan
            </button>
          </div>
          
          {/* Horizontal Date Picker */}
          <div className="mobile-date-picker">
            {dates.map(({ dayEn, date, iso }, i) => (
              <div 
                key={dayEn} 
                className={`date-item ${dayEn === selectionModal.day || (!selectionModal.day && i === 0) ? 'active' : ''}`}
                onClick={() => setSelectionModal(prev => ({ ...prev, day: dayEn }))}
              >
                <span className="day-label">{dayEn}</span>
                <span className="date-label">{date}</span>
              </div>
            ))}
          </div>
        </header>
      )}

      {/* 2. Grid (Mobile Specific Layout) */}
      {!Capacitor.isNativePlatform() ? (
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
      ) : (
        <div className="mobile-meal-list">
          {slots.map(slot => {
            const currentDay = selectionModal.day || dates[0].dayEn;
            const meal = plannedMeals[`${currentDay}-${slot}`];
            return (
              <div key={slot} className="mobile-slot-section">
                <div className="slot-title">BỮA {slot.toUpperCase()}</div>
                {meal ? (
                  <div className="mobile-meal-card animate-slideInRight">
                    <img src={meal.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"} alt={meal.title} />
                    <div className="meal-details">
                      <h4>{meal.title}</h4>
                      <div className="meal-meta">
                        <span>{meal.cal} kcal</span>
                        <span>•</span>
                        <span>25 min</span>
                      </div>
                    </div>
                    <button className="remove-btn" onClick={() => handleRemoveMeal(`${currentDay}-${slot}`)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="mobile-empty-slot" onClick={() => handleAddMeal(currentDay, slot)}>
                    <div className="add-content">
                      <Plus size={24} />
                      <span>Thêm món cho bữa {slot.toLowerCase()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Calorie Alert Mobile */}
          {dailyTotals[selectionModal.day || dates[0].dayEn] > 2500 && (
            <div className="mobile-calorie-alert">
              <AlertTriangle size={20} />
              <span>Cảnh báo: Lượng Calo hôm nay đã vượt ngưỡng cho phép!</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Bottom Widgets (Web Only) */}
      {!Capacitor.isNativePlatform() && (
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
      )}

      {/* 4. Selection Modal (Web) / Bottom Sheet (Mobile) */}
      {selectionModal.show && (
        <div className={`planner-modal-overlay ${Capacitor.isNativePlatform() ? "bottom-sheet" : ""}`} onClick={() => setSelectionModal({ show: false, day: null, slot: null })}>
          <div className="planner-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-drag-handle"></div>
            <div className="modal-header">
              <div className="header-top">
                <h4>{Capacitor.isNativePlatform() ? "Saved Recipes" : `Chọn món cho ${selectionModal.day} - ${selectionModal.slot}`}</h4>
                {!Capacitor.isNativePlatform() && <button className="close-btn" onClick={() => setSelectionModal({ show: false, day: null, slot: null })}><Plus style={{transform: 'rotate(45deg)'}} /></button>}
              </div>
              <div className="modal-tabs">
                <button 
                  className={`modal-tab ${selectionModal.activeTab === 'saved' ? 'active' : ''}`}
                  onClick={() => setSelectionModal(prev => ({ ...prev, activeTab: 'saved' }))}
                >
                  Khay món ăn
                </button>
                <button 
                  className={`modal-tab ${selectionModal.activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectionModal(prev => ({ ...prev, activeTab: 'all' }))}
                >
                  Tất cả
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
            </div>
          </div>
        </div>
      )}

      {/* AI Meal Planner Modal */}
      {isAIModalOpen && (
        <div className="planner-modal-overlay animate-fadeIn" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="planner-modal-card animate-popIn" style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            {isGenerating ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <Loader className="animate-spin text-green-500" size={48} style={{ margin: '0 auto 20px auto' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>Đang Tạo Kế Hoạch Ăn Uống AI</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5' }}>AI của HomeChef đang phân tích khẩu vị của bạn và nguyên liệu sẵn có trong tủ lạnh để thiết lập thực đơn tối ưu. Vui lòng đợi trong giây lát...</p>
              </div>
            ) : (
              <form onSubmit={handleRunAI}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                    <Sparkles className="text-green-500" size={20} /> AI Meal Planner
                  </h3>
                  <button type="button" onClick={() => setIsAIModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {/* Eaters Count */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Có bao nhiêu người ăn?</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={aiForm.peopleCount}
                      onChange={e => setAiForm(prev => ({ ...prev, peopleCount: parseInt(e.target.value) || 2 }))}
                      style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                      required
                    />
                  </div>

                  {/* Days Count */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Muốn lên kế hoạch trong mấy ngày? (Giới hạn tối đa 3 ngày)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {[1, 2, 3].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setAiForm(prev => ({ ...prev, daysCount: d }))}
                          style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '10px',
                            border: aiForm.daysCount === d ? '2px solid #10B981' : '1px solid #cbd5e1',
                            background: aiForm.daysCount === d ? '#ecfdf5' : 'white',
                            color: aiForm.daysCount === d ? '#047857' : '#475569',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          {d} ngày
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diet Mode (Premium) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Chế độ dinh dưỡng đặc biệt</label>
                    <select
                      value={aiForm.dietMode}
                      onChange={e => {
                        const val = e.target.value;
                        if (val !== 'balanced' && user?.plan === 'free') {
                          setIsUpgradeModalOpen(true);
                        } else {
                          setAiForm(prev => ({ ...prev, dietMode: val }));
                        }
                      }}
                      style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: 'white' }}
                    >
                      <option value="balanced">Cân bằng tự nhiên (Mặc định)</option>
                      <option value="gym">🏋️ Gym / Tăng cơ giảm mỡ {user?.plan === 'free' && '(Premium 🔒)'}</option>
                      <option value="keto">🥩 Keto / Lowcarb {user?.plan === 'free' && '(Premium 🔒)'}</option>
                      <option value="clean_eating">🥗 Ăn sạch / Healthy {user?.plan === 'free' && '(Premium 🔒)'}</option>
                    </select>
                  </div>

                  {/* Prioritize Pantry */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <input 
                      type="checkbox" 
                      id="prioritizePantry"
                      checked={aiForm.prioritizePantry}
                      onChange={e => setAiForm(prev => ({ ...prev, prioritizePantry: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: '#10B981', cursor: 'pointer' }}
                    />
                    <label htmlFor="prioritizePantry" style={{ fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                      Ưu tiên nguyên liệu có sẵn trong tủ lạnh 🥬
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    type="button" 
                    onClick={() => setIsAIModalOpen(false)} 
                    style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', background: 'white', color: '#475569', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit" 
                    style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}
                  >
                    Bắt đầu tạo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal for Premium features */}
      {isUpgradeModalOpen && (
        <div className="planner-modal-overlay animate-fadeIn" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="planner-modal-card animate-popIn" style={{ background: 'white', borderRadius: '20px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#FFF5F5', padding: '16px', borderRadius: '50%', display: 'inline-flex', marginBottom: '20px' }}>
              <Sparkles size={36} style={{ color: '#FF6B6B' }} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>Nâng Cấp Premium</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.5', marginBottom: '24px' }}>Mở khóa toàn bộ các tính năng cao cấp như: Lên thực đơn theo chế độ đặc biệt (Gym/Keto), quét hóa đơn đi chợ và theo dõi dinh dưỡng hàng ngày.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setIsUpgradeModalOpen(false)} 
                style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '10px', background: 'white', color: '#475569', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  navigate('/pricing');
                }} 
                style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)', color: 'white', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(255, 107, 107, 0.3)' }}
              >
                Nâng cấp ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MealPlanner;
