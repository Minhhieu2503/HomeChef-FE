import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { getRecommendedRecipes, generateAIRecommendations } from "../../services/recipeService";
import { getPantryItems } from "../../services/pantryService";
import { useToast } from "../../context/ToastContext";
import "./TestGoal.css";

function TestGoal() {
  const navigate = useNavigate();
  const toast = useToast();
  // Try to load cached data for instant page rendering
  const getCachedData = () => {
    try {
      const cached = sessionStorage.getItem("homechef_test_goal_cache");
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error("Cache read error:", e);
    }
    return null;
  };

  const cached = getCachedData();

  const [user, setUser] = useState(cached?.user || null);
  const [goal, setGoal] = useState(cached?.goal || "balanced");
  const [recipes, setRecipes] = useState(cached?.recipes || []);
  const [pantryItems, setPantryItems] = useState(cached?.pantryItems || []);
  const [loading, setLoading] = useState(!cached); // only show spinner if no cache
  const [updating, setUpdating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecipes, setAiRecipes] = useState(cached?.aiRecipes || []);
  const [statusMsg, setStatusMsg] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [activeVoiceStep, setActiveVoiceStep] = useState(null);
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const [showSubscriptionPitch, setShowSubscriptionPitch] = useState(false);
  const [checkoutPartner, setCheckoutPartner] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState(0); // 0: closed, 1: syncing, 2: success

  const handleAffiliateCheckout = (partner) => {
    setCheckoutPartner(partner);
    setCheckoutStep(1);
    
    // Simulate API checkout cart handoff after 2 seconds
    setTimeout(() => {
      setCheckoutStep(2);
    }, 2000);
  };

  useEffect(() => {
    setCompletedSteps({});
  }, [selectedRecipe]);

  const loadData = async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }

      // Parallelize all three calls to cut response time in half!
      const [profileRes, pantryData, recData] = await Promise.all([
        authService.getMe(),
        getPantryItems(),
        getRecommendedRecipes(true).catch(err => {
          console.error("Failed to load recipes:", err);
          return [];
        })
      ]);

      let nextUser = user;
      let nextGoal = goal;
      let nextRecipes = recipes;
      let nextPantryItems = pantryItems;

      if (profileRes.success) {
        nextUser = profileRes.data;
        nextGoal = profileRes.data.healthGoal || "balanced";
        setUser(nextUser);
        setGoal(nextGoal);
      }

      if (pantryData) {
        nextPantryItems = pantryData;
        setPantryItems(nextPantryItems);
      }

      if (recData) {
        nextRecipes = recData;
        setRecipes(nextRecipes);
      }

      // Save to cache for instant subsequent loads
      try {
        sessionStorage.setItem("homechef_test_goal_cache", JSON.stringify({
          user: nextUser,
          goal: nextGoal,
          recipes: nextRecipes,
          pantryItems: nextPantryItems,
          aiRecipes: cached?.aiRecipes || []
        }));
      } catch (cacheErr) {
        console.error("Failed to write to sessionStorage:", cacheErr);
      }

    } catch (error) {
      console.error("Error loading test data:", error);
      const errorMsg = "Lỗi khi tải dữ liệu. Vui lòng kiểm tra kết nối local server.";
      setStatusMsg(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cachedData = null;
    try {
      cachedData = sessionStorage.getItem("homechef_test_goal_cache");
    } catch (e) {
      console.error("Cache read error:", e);
    }
    loadData(!cachedData); // Silent refresh if cache is present, spinner if not
  }, []);

  const handleGoalChange = async (targetGoal) => {
    try {
      setUpdating(true);
      setStatusMsg(`Đang cập nhật mục tiêu sang: ${getGoalLabel(targetGoal)}...`);
      
      const res = await authService.updateProfile({ healthGoal: targetGoal });
      if (res.success) {
        const nextUser = res.data;
        const nextGoal = res.data.healthGoal;
        setUser(nextUser);
        setGoal(nextGoal);
        setStatusMsg(`Đã cập nhật mục tiêu! Đang tải lại danh sách món ăn gợi ý...`);

        // Fetch recommendations with cache bypassed
        const recData = await getRecommendedRecipes(true);
        setRecipes(recData || []);

        // Update cache
        try {
          sessionStorage.setItem("homechef_test_goal_cache", JSON.stringify({
            user: nextUser,
            goal: nextGoal,
            recipes: recData || [],
            pantryItems: pantryItems,
            aiRecipes: cached?.aiRecipes || []
          }));
        } catch (cacheErr) {
          console.error("Failed to write to sessionStorage:", cacheErr);
        }

        const successMsg = `Đã cập nhật thực đơn phù hợp cho: ${getGoalLabel(targetGoal)}!`;
        setStatusMsg(successMsg);
        toast.success(successMsg);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      const errorMsg = "Lỗi khi cập nhật mục tiêu sức khỏe.";
      setStatusMsg(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  const triggerAISuggestions = async () => {
    try {
      setAiLoading(true);
      setStatusMsg("Home Chef AI đang phân tích tủ lạnh và mục tiêu sức khỏe để thiết kế món ăn...");
      
      // Get ingredient names
      const ingredients = pantryItems.map(item => item.name);
      if (ingredients.length === 0) {
        const warningMsg = "Tủ lạnh của bạn đang trống! Vui lòng thêm nguyên liệu ở trang Tủ Lạnh.";
        setStatusMsg(warningMsg);
        toast.warning(warningMsg);
        setAiLoading(false);
        return;
      }

      const res = await generateAIRecommendations(ingredients);
      if (res.success || Array.isArray(res)) {
        // Depending on backend API response wrapping
        const data = Array.isArray(res) ? res : res.data;
        const finalData = data || [];
        setAiRecipes(finalData);
        
        const successMsg = "Đã tạo gợi ý thực đơn từ Home Chef AI thành công!";
        setStatusMsg(successMsg);
        toast.success(successMsg);

        // Update cache with new AI recommendations
        const currentCache = getCachedData() || {};
        try {
          sessionStorage.setItem("homechef_test_goal_cache", JSON.stringify({
            ...currentCache,
            aiRecipes: finalData
          }));
        } catch (cacheErr) {
          console.error("Failed to write to sessionStorage:", cacheErr);
        }
      }
    } catch (error) {
      console.error("AI Generation error:", error);
      const errorMsg = "Lỗi khi tạo công thức từ Home Chef AI.";
      setStatusMsg(errorMsg);
      toast.error(errorMsg);
    } finally {
      setAiLoading(false);
    }
  };

  const getGoalLabel = (g) => {
    if (g === "lose_weight") return "Giảm cân 📉";
    if (g === "gain_weight") return "Tăng cân 📈";
    return "Cân bằng dinh dưỡng 🥗";
  };

  const getGoalCardClass = (g) => {
    return `goal-card ${goal === g ? "active" : ""} ${g}`;
  };

  return (
    <div className="test-goal-container">
      <div className="test-goal-header">
        <h1>Phòng Thử Nghiệm Cá Nhân Hóa Thực Đơn 🎯</h1>
        <p className="test-subtitle">
          Kiểm thử nhanh thuật toán phân bổ calo/dinh dưỡng và gợi ý từ Home Chef AI theo 3 mục tiêu sức khỏe.
        </p>
      </div>

      {/* STATISTICS ROW */}
      <div className="test-stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)" }}>🎯</div>
          <div>
            <div className="stat-info-title">Mục Tiêu Hiện Tại</div>
            <div className="stat-info-val">{goal === "lose_weight" ? "Giảm Cân 📉" : goal === "gain_weight" ? "Tăng Cân 📈" : "Cân Bằng 🥗"}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99, 102, 241, 0.1)" }}>🥦</div>
          <div>
            <div className="stat-info-title">Nguyên Liệu Trong Kho</div>
            <div className="stat-info-val">{pantryItems.length} loại có sẵn</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(234, 88, 12, 0.1)" }}>🍲</div>
          <div>
            <div className="stat-info-title">Đề Xuất Khả Dụng</div>
            <div className="stat-info-val">{recipes.length} món phù hợp</div>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="test-status-banner">
          <span className="pulse-dot"></span>
          <p>{statusMsg}</p>
        </div>
      )}

      {loading ? (
        <div className="test-loading">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu mô phỏng...</p>
        </div>
      ) : (
        <>
          {/* Primary Goal Selector Card (Full Width) */}
          <div className="panel-card goal-selector-card full-width-selector">
            <h2>Chọn Mục Tiêu Sức Khỏe</h2>
            <p className="panel-instruction">Nhấp chọn mục tiêu để kiểm thử sự thay đổi thuật toán gợi ý món ăn:</p>
            
            <div className="goal-options-grid">
              <div 
                className={getGoalCardClass("lose_weight")} 
                onClick={() => !updating && handleGoalChange("lose_weight")}
              >
                <div className="goal-icon">📉</div>
                <div className="goal-info">
                  <h3>Giảm Cân</h3>
                  <p>Ưu tiên món ít calo (&lt; 450 kcal), thanh đạm, ít béo.</p>
                </div>
              </div>

              <div 
                className={getGoalCardClass("balanced")} 
                onClick={() => !updating && handleGoalChange("balanced")}
              >
                <div className="goal-icon">🥗</div>
                <div className="goal-info">
                  <h3>Cân Bằng</h3>
                  <p>Duy trì calo vừa phải (~ 500 kcal), đầy đủ chất xơ, vitamin.</p>
                </div>
              </div>

              <div 
                className={getGoalCardClass("gain_weight")} 
                onClick={() => !updating && handleGoalChange("gain_weight")}
              >
                <div className="goal-icon">📈</div>
                <div className="goal-info">
                  <h3>Tăng Cân</h3>
                  <p>Ưu tiên món giàu calo (&gt; 600 kcal) và đạm (Protein &gt; 20g).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="test-grid">
            {/* LEFT: CONTROLLERS */}
            <div className="test-control-panel">
              <div className="panel-card user-profile-card">
                <h2>Tài Khoản Hiện Tại</h2>
                <div className="user-profile-meta">
                  <img 
                    src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=4ADE80&color=fff"} 
                    alt="Avatar" 
                    className="test-user-avatar"
                  />
                  <div className="user-text-info">
                    <h3>{user?.name || "Người dùng Thử nghiệm"}</h3>
                    <p className="user-email">{user?.email}</p>
                    <p className="user-current-goal">
                      <span>Mục tiêu hiện tại: </span><strong>{getGoalLabel(goal)}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="panel-card simulator-pantry-card">
                <h2>Nguyên Liệu Trong Tủ Lạnh ({pantryItems.length})</h2>
                <div className="simulator-ingredients-list">
                  {pantryItems.length === 0 ? (
                    <p className="empty-pantry-text">Tủ lạnh trống! Hãy thêm nguyên liệu để bắt đầu gợi ý.</p>
                  ) : (
                    pantryItems.map(item => (
                      <span key={item._id} className="sim-ingredient-badge">
                        🟢 {item.name} ({item.quantity} {item.unit})
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="panel-card ai-testing-card">
                <h2>Kiểm Thử Đề Xuất Home Chef AI</h2>
                <p className="panel-instruction">
                  Home Chef AI sẽ nhận danh sách nguyên liệu và mục tiêu sức khỏe hiện tại là <strong>{getGoalLabel(goal)}</strong> để sáng tạo các món ăn phù hợp.
                </p>
                <button 
                  onClick={triggerAISuggestions} 
                  className="btn-trigger-ai"
                  disabled={aiLoading || pantryItems.length === 0}
                >
                  {aiLoading ? "Đang gửi yêu cầu tới Home Chef AI..." : "🚀 Kích Hoạt Đề Xuất Home Chef AI"}
                </button>
              </div>
            </div>

            {/* RIGHT: LIVE RECOMMENDATIONS */}
            <div className="test-results-panel">
            <div className="panel-card results-card">
              <div className="results-header">
                <h2>Gợi Ý Cục Bộ (Thực Tế Từ Database)</h2>
                <span className="results-count">{recipes.length} món ăn phù hợp</span>
              </div>
              <p className="panel-instruction">
                <span>Thuật toán đã lọc nguyên liệu khớp và tự động sắp xếp theo tiêu chí:</span>
                {goal === "lose_weight" && <span><strong> Lượng Calo thấp lên trước.</strong></span>}
                {goal === "gain_weight" && <span><strong> Lượng Calo và Protein cao lên trước.</strong></span>}
                {goal === "balanced" && <span><strong> Lượng Calo ổn định trung bình (~500 kcal).</strong></span>}
              </p>

              <div className="recipe-results-list">
                {recipes.length === 0 ? (
                  <div className="no-results">
                    <p>Không tìm thấy công thức nấu ăn nào khớp với tủ lạnh hiện tại.</p>
                  </div>
                ) : (
                  recipes.map((recipe, index) => {
                    const isOptimal = 
                      (goal === "lose_weight" && recipe.calories < 450) ||
                      (goal === "gain_weight" && recipe.calories > 600 && recipe.protein > 20) ||
                      (goal === "balanced" && recipe.calories >= 400 && recipe.calories <= 600);

                    return (
                      <div key={recipe._id} className={`recipe-result-item ${isOptimal ? "optimal" : ""}`} onClick={() => setSelectedRecipe(recipe)}>
                        <div className="item-rank">#{index + 1}</div>
                        <img 
                          src={recipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=200"} 
                          alt={recipe.title} 
                          className="recipe-item-img"
                        />
                        <div className="recipe-item-details">
                          <div className="title-row">
                            <h3>{recipe.title}</h3>
                            {isOptimal && (
                              <span className="optimal-badge">
                                {goal === "lose_weight" && "Calo Thấp ⭐"}
                                {goal === "gain_weight" && "Calo/Đạm Cao ⭐"}
                                {goal === "balanced" && "Cân Bằng ⭐"}
                              </span>
                            )}
                          </div>
                          
                          <div className="nutrients-row">
                            <span className="nutrient-val cal">🔥 {recipe.calories || 0} kcal</span>
                            <span className="nutrient-val pro">🥩 {recipe.protein || 0}g protein</span>
                            <span className="nutrient-val fat">🥑 {recipe.fat || 0}g béo</span>
                            <span className="nutrient-val carb">🍞 {recipe.carbs || 0}g carb</span>
                          </div>

                          <div className="matching-explanation">
                            <p>
                              <span>👉 <strong>Chi tiết:</strong> Chứa nguyên liệu trong tủ lạnh.</span>
                              {goal === "lose_weight" && <span> Phù hợp chế độ Giảm Cân vì năng lượng cung cấp thấp ({recipe.calories} kcal).</span>}
                              {goal === "gain_weight" && <span> Phù hợp chế độ Tăng Cân nhờ lượng protein cực tốt ({recipe.protein}g) và calo cao ({recipe.calories} kcal).</span>}
                              {goal === "balanced" && <span> Thích hợp dinh dưỡng Cân Bằng với mức calo lý tưởng ({recipe.calories} kcal).</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AI SUGGESTION RESULTS */}
            {aiRecipes.length > 0 && (
              <div className="panel-card results-card ai-results-card">
                <div className="results-header">
                  <h2>Kết Quả Home Chef AI Trả Về (Sáng Tạo)</h2>
                  <span className="results-count ai-count">{aiRecipes.length} công thức sáng tạo</span>
                </div>
                <p className="panel-instruction">
                  Danh sách món ăn được Home Chef AI thiết kế theo mục tiêu <strong>{getGoalLabel(goal)}</strong>:
                </p>

                <div className="recipe-results-list">
                  {aiRecipes.map((recipe, index) => (
                    <div key={index} className="recipe-result-item ai-item" onClick={() => setSelectedRecipe(recipe)}>
                      <div className="item-rank ai-rank">AI #{index + 1}</div>
                      <div className="recipe-item-details">
                        <h3>{recipe.title}</h3>
                        <p className="recipe-desc">{recipe.description}</p>
                        
                        <div className="nutrients-row">
                          <span className="nutrient-val cal">🔥 {recipe.calories || 0} kcal</span>
                          <span className="nutrient-val pro">🥩 {recipe.protein || 0}g protein</span>
                          <span className="nutrient-val fat">🥑 {recipe.fat || 0}g béo</span>
                          <span className="nutrient-val carb">🍞 {recipe.carbs || 0}g carb</span>
                        </div>

                        <div className="matching-explanation ai-explanation">
                          <div style={{ marginBottom: "4px" }}>
                            <strong style={{ color: "#16a34a" }}>🟢 Sẵn có:</strong>{" "}
                            {recipe.ingredients
                              ?.filter(i => i.quantity !== "Cần mua thêm")
                              .map(i => i.name)
                              .join(", ") || "Không"}
                          </div>
                          {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
                            <div>
                              <strong style={{ color: "#dc2626" }}>🔴 Cần mua thêm:</strong>{" "}
                              {recipe.missingIngredients.join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )}

      {/* RECIPE DETAILS MODAL */}
      {selectedRecipe && (
        <div className="recipe-modal-backdrop" onClick={() => setSelectedRecipe(null)}>
          <div className="recipe-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setSelectedRecipe(null)}>×</button>
            
            <div className="recipe-modal-header-img">
              <img 
                src={selectedRecipe.image || "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400"} 
                alt={selectedRecipe.title} 
                className="recipe-modal-img"
              />
              <div className="recipe-modal-img-overlay">
                <h2 className="recipe-modal-title">{selectedRecipe.title}</h2>
              </div>
            </div>

            <div className="recipe-modal-body">
              <div className="recipe-modal-meta-row">
                <span className="recipe-modal-badge">⏰ {selectedRecipe.cookTime || 15} phút</span>
                <span className="recipe-modal-badge difficulty-badge">🏷️ Độ khó: {selectedRecipe.difficulty === "Easy" ? "Dễ" : selectedRecipe.difficulty === "Medium" ? "Trung bình" : "Vừa"}</span>
                <span className="recipe-modal-badge">🥗 Năng lượng: {selectedRecipe.calories} kcal</span>
              </div>

              {selectedRecipe.description && (
                <p className="recipe-modal-description">{selectedRecipe.description}</p>
              )}

              {/* Green & Saving Impact Widget */}
              <div className="green-impact-widget">
                <h3 className="section-title">🌱 Chỉ Số Sức Khỏe Xanh & Tiết Kiệm</h3>
                <div className="impact-cards-grid">
                  <div className="impact-card-box green">
                    <div className="impact-box-icon">♻️</div>
                    <div className="impact-box-info">
                      <h4>Tận dụng tủ lạnh</h4>
                      <p>Sử dụng <strong>{selectedRecipe.ingredients?.filter(i => i.quantity !== "Cần mua thêm").length || 0}</strong> nguyên liệu có sẵn</p>
                    </div>
                  </div>
                  <div className="impact-card-box money">
                    <div className="impact-box-icon">💰</div>
                    <div className="impact-box-info">
                      <h4>Tiết kiệm chi phí</h4>
                      <p>Tránh lãng phí thực phẩm: <strong>~{((selectedRecipe.ingredients?.filter(i => i.quantity !== "Cần mua thêm").length || 0) * 35000).toLocaleString('vi-VN')} đ</strong></p>
                    </div>
                  </div>
                  <div className="impact-card-box co2">
                    <div className="impact-box-icon">🌍</div>
                    <div className="impact-box-info">
                      <h4>Giảm khí thải CO₂</h4>
                      <p>Giảm thiểu phát thải: <strong>~{((selectedRecipe.ingredients?.filter(i => i.quantity !== "Cần mua thêm").length || 0) * 0.4).toFixed(1)} kg CO₂</strong></p>
                    </div>
                  </div>
                </div>
                <div className="premium-lock-banner">
                  <span>🔒 Phân tích đầy đủ lượng nước & năng lượng tiêu thụ (Hội viên Premium)</span>
                </div>
              </div>

              {/* Nutrition progress charts */}
              <div>
                <h3 className="section-title">📊 Biểu Đồ Dinh Dưỡng</h3>
                <div className="nutrition-bars-grid">
                  <div className="nutrition-bar-wrapper">
                    <div className="nutrition-bar-label">Calo</div>
                    <div className="progress-track">
                      <div className="progress-bar cal" style={{ width: `${Math.min(100, (selectedRecipe.calories / 800) * 100)}%` }}></div>
                    </div>
                    <div className="nutrition-bar-val">{selectedRecipe.calories} kcal</div>
                  </div>

                  <div className="nutrition-bar-wrapper">
                    <div className="nutrition-bar-label">Protein</div>
                    <div className="progress-track">
                      <div className="progress-bar pro" style={{ width: `${Math.min(100, (selectedRecipe.protein / 50) * 100)}%` }}></div>
                    </div>
                    <div className="nutrition-bar-val">{selectedRecipe.protein}g</div>
                  </div>

                  <div className="nutrition-bar-wrapper">
                    <div className="nutrition-bar-label">Chất Béo</div>
                    <div className="progress-track">
                      <div className="progress-bar fat" style={{ width: `${Math.min(100, (selectedRecipe.fat / 40) * 100)}%` }}></div>
                    </div>
                    <div className="nutrition-bar-val">{selectedRecipe.fat}g</div>
                  </div>

                  <div className="nutrition-bar-wrapper">
                    <div className="nutrition-bar-label">Carbs</div>
                    <div className="progress-track">
                      <div className="progress-bar carb" style={{ width: `${Math.min(100, (selectedRecipe.carbs / 100) * 100)}%` }}></div>
                    </div>
                    <div className="nutrition-bar-val">{selectedRecipe.carbs}g</div>
                  </div>
                </div>
              </div>

              {/* Ingredients list */}
              <div>
                <h3 className="section-title">🛒 Thành Phần Nguyên Liệu</h3>
                <div className="modal-ingredients-list">
                  {selectedRecipe.ingredients?.map((ing, idx) => {
                    const isMissing = 
                      ing.quantity === "Cần mua thêm" || 
                      (selectedRecipe.missingIngredients && selectedRecipe.missingIngredients.includes(ing.name)) ||
                      (!selectedRecipe.missingIngredients && !pantryItems.some(p => p.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(p.name.toLowerCase())));
                    
                    return (
                      <div key={idx} className="modal-ingredient-row">
                        <span className="modal-ingredient-name-col">
                          <span className={`modal-ingredient-status-dot ${isMissing ? "missing" : "in-stock"}`}></span>
                          {ing.name}
                        </span>
                        <span className="modal-ingredient-qty">
                          {isMissing ? "🔴 Cần mua thêm" : `🟢 Sẵn có (${ing.quantity || "Đủ lượng"})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Affiliate Commerce Integration: Order Missing Ingredients */}
              {selectedRecipe.ingredients?.some(ing => {
                const isMissing = 
                  ing.quantity === "Cần mua thêm" || 
                  (selectedRecipe.missingIngredients && selectedRecipe.missingIngredients.includes(ing.name)) ||
                  (!selectedRecipe.missingIngredients && !pantryItems.some(p => p.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(p.name.toLowerCase())));
                return isMissing;
              }) && (
                <div className="affiliate-order-box">
                  <div className="affiliate-header">
                    <span className="affiliate-badge">💰 Đối tác liên kết</span>
                    <h4>Thiếu nguyên liệu? Đặt giao siêu tốc!</h4>
                  </div>
                  <p className="affiliate-desc">
                    Đồng bộ các nguyên liệu còn thiếu trực tiếp vào giỏ hàng đối tác để nấu ăn ngay lập tức.
                  </p>
                  <div className="affiliate-partner-buttons">
                    <button 
                      className="btn-affiliate-partner grab"
                      onClick={() => handleAffiliateCheckout("GrabMart")}
                    >
                      <span className="partner-logo">🟢</span> GrabMart (30 phút)
                    </button>
                    <button 
                      className="btn-affiliate-partner shopee"
                      onClick={() => handleAffiliateCheckout("ShopeeFood")}
                    >
                      <span className="partner-logo">🍊</span> ShopeeFood (Giao nhanh)
                    </button>
                    <button 
                      className="btn-affiliate-partner bhx"
                      onClick={() => handleAffiliateCheckout("Bách Hóa Xanh")}
                    >
                      <span className="partner-logo">🥬</span> Bách Hóa (Giá tốt)
                    </button>
                  </div>
                </div>
              )}

              {/* Steps list */}
              {selectedRecipe.steps && selectedRecipe.steps.length > 0 && (
                <div>
                  <h3 className="section-title">🍳 Hướng Dẫn Các Bước Nấu</h3>
                  <div className="modal-steps-list">
                    {selectedRecipe.steps.map((step) => {
                      const isCompleted = !!completedSteps[step.order];
                      return (
                        <div 
                          key={step.order} 
                          className={`modal-step-row ${isCompleted ? "completed" : ""}`}
                          onClick={() => setCompletedSteps(prev => ({ ...prev, [step.order]: !prev[step.order] }))}
                        >
                          <div className="modal-step-checkbox-wrapper">
                            <input 
                              type="checkbox" 
                              checked={isCompleted}
                              onChange={() => {}} // handled by row click
                              className="modal-step-checkbox"
                            />
                          </div>
                          <div className="modal-step-text-col">
                            <div className="modal-step-order">Bước {step.order}</div>
                            <p className="modal-step-instruction">{step.instruction}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="recipe-modal-footer">
              <button 
                className="btn-cook-action"
                onClick={() => {
                  setSelectedRecipe(null);
                  setActiveVoiceStep(1);
                  setShowVoiceAssistant(true);
                }}
              >
                🎙️ Bắt Đầu Nấu Rảnh Tay (Bản dùng thử)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOICE COOKING ASSISTANT MODAL */}
      {showVoiceAssistant && selectedRecipe && (
        <div className="voice-modal-backdrop" onClick={() => setShowVoiceAssistant(false)}>
          <div className="voice-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-header">
              <h3>🎙️ Trợ Lý Giọng Nói Home Chef</h3>
              <span className="voice-badge">Dùng thử miễn phí</span>
            </div>
            
            <div className="voice-listening-indicator">
              <div className="pulse-ring"></div>
              <div className="mic-icon">🎙️</div>
              <div className="listening-text">Đang lắng nghe khẩu lệnh: "Tiếp theo", "Quay lại"...</div>
            </div>

            <div className="voice-step-card">
              <div className="voice-step-header">
                Bước {activeVoiceStep} / {selectedRecipe.steps?.length || 1}
              </div>
              <p className="voice-step-text">
                {selectedRecipe.steps?.find(s => s.order === activeVoiceStep)?.instruction || "Đang tải bước nấu tiếp theo..."}
              </p>
            </div>

            <div className="voice-actions">
              <button 
                className="btn-voice-nav" 
                disabled={activeVoiceStep <= 1}
                onClick={() => setActiveVoiceStep(prev => prev - 1)}
              >
                ⬅️ Quay lại
              </button>
              <button 
                className="btn-voice-nav primary"
                onClick={() => {
                  if (activeVoiceStep >= (selectedRecipe.steps?.length || 1)) {
                    setShowVoiceAssistant(false);
                    setShowSubscriptionPitch(true);
                  } else {
                    setActiveVoiceStep(prev => prev + 1);
                  }
                }}
              >
                {activeVoiceStep === (selectedRecipe.steps?.length || 1) ? "Hoàn thành 🎉" : "Tiếp theo ➡️"}
              </button>
            </div>

            <button className="btn-close-voice" onClick={() => setShowVoiceAssistant(false)}>Đóng</button>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION PITCH MODAL */}
      {showSubscriptionPitch && (
        <div className="pitch-modal-backdrop" onClick={() => setShowSubscriptionPitch(false)}>
          <div className="pitch-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pitch-icon">🏆</div>
            <h2>Mở Khóa Trải Nghiệm Nấu Ăn Không Giới Hạn!</h2>
            <p className="pitch-desc">
              Trải nghiệm điều khiển đứng bếp bằng giọng nói rảnh tay thật tuyệt vời đúng không? Hãy nâng cấp lên tài khoản **Premium** hoặc **Family Plan** để:
            </p>
            
            <ul className="pitch-features">
              <li>✨ Sử dụng Trợ Lý Giọng Nói không giới hạn (rất tiện lợi khi dính nước/dầu mỡ).</li>
              <li>🌱 Xem đầy đủ Phân tích Dinh dưỡng Vi lượng & Cảnh báo Sức khỏe.</li>
              <li>🗓️ Lên kế hoạch thực đơn tự động cho cả gia đình trong 7 ngày.</li>
              <li>🛒 Tự động điền giỏ mua sắm và chia sẻ danh sách đi chợ thành viên.</li>
            </ul>

            <div className="pitch-pricing-options">
              <div className="pitch-option">
                <div className="option-name">Premium cá nhân</div>
                <div className="option-price">49k/tháng</div>
              </div>
              <div className="pitch-option popular">
                <div className="option-badge">Phổ biến nhất</div>
                <div className="option-name">Family Plan (5 thành viên)</div>
                <div className="option-price">99k/tháng</div>
              </div>
            </div>

            <div className="pitch-actions">
              <button className="btn-pitch-upgrade" onClick={() => {
                setShowSubscriptionPitch(false);
                navigate("/pricing");
              }}>
                🚀 Nâng cấp ngay
              </button>
              <button className="btn-pitch-cancel" onClick={() => {
                setShowSubscriptionPitch(false);
              }}>
                Trải nghiệm sau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AFFILIATE CHECKOUT SIMULATION MODAL */}
      {checkoutStep > 0 && selectedRecipe && (
        <div className="checkout-modal-backdrop" onClick={() => setCheckoutStep(0)}>
          <div className="checkout-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-voice" style={{ position: "absolute", top: "15px", right: "15px", fontSize: "1.2rem" }} onClick={() => setCheckoutStep(0)}>×</button>
            {checkoutStep === 1 ? (
              <div className="checkout-loading-state">
                <div className="spinner partner-spinner"></div>
                <h3>Đang đồng bộ với {checkoutPartner}...</h3>
                <p>Đang tự động đóng gói nguyên liệu thiếu vào giỏ hàng đối tác...</p>
                <div className="syncing-list">
                  {selectedRecipe.ingredients
                    ?.filter(ing => 
                      ing.quantity === "Cần mua thêm" || 
                      (selectedRecipe.missingIngredients && selectedRecipe.missingIngredients.includes(ing.name)) ||
                      (!selectedRecipe.missingIngredients && !pantryItems.some(p => p.name.toLowerCase().includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(p.name.toLowerCase())))
                    )
                    .map((ing, idx) => (
                      <div key={idx} className="sync-item-row">
                        🛒 {ing.name} (Định lượng chuẩn)
                      </div>
                    ))
                  }
                </div>
              </div>
            ) : (
              <div className="checkout-success-state" style={{ padding: "1rem 0" }}>
                <div className="success-check-icon" style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#22c55e", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", margin: "0 auto 1.25rem auto" }}>✓</div>
                <h3>Liên Kết Giỏ Hàng Thành Công!</h3>
                <p style={{ color: "#475569", fontSize: "0.95rem", margin: "0.5rem 0 1.5rem 0" }}>
                  Đã chuyển thành công các nguyên liệu còn thiếu vào giỏ hàng <strong>{checkoutPartner}</strong> của bạn.
                </p>
                <div className="success-details-card" style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px", textAlign: "left", marginBottom: "1.5rem", fontSize: "0.85rem" }}>
                  <p style={{ margin: "4px 0" }}><strong>📍 Cửa hàng đề xuất:</strong> Siêu thị WinMart+ gần nhất</p>
                  <p style={{ margin: "4px 0" }}><strong>🏷️ Ưu đãi áp dụng:</strong> Giảm giá 10% cho đơn hàng đầu tiên!</p>
                  <p style={{ margin: "4px 0", color: "#10b981" }}><strong>📈 Hoa hồng tích lũy (Affiliate):</strong> 3.5% (Doanh thu tiếp thị)</p>
                </div>
                <div className="checkout-actions" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button className="btn-pitch-upgrade" onClick={() => {
                    setCheckoutStep(0);
                    setSelectedRecipe(null);
                  }}>
                    🛍️ Tiếp tục thanh toán trên {checkoutPartner}
                  </button>
                  <button className="btn-pitch-cancel" onClick={() => setCheckoutStep(0)}>
                    Quay lại ứng dụng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TestGoal;
