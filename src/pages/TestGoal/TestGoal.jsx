import { useState, useEffect } from "react";
import { authService } from "../../services/auth.service";
import { getRecommendedRecipes, generateAIRecommendations } from "../../services/recipeService";
import { getPantryItems } from "../../services/pantryService";
import "./TestGoal.css";

function TestGoal() {
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
      sessionStorage.setItem("homechef_test_goal_cache", JSON.stringify({
        user: nextUser,
        goal: nextGoal,
        recipes: nextRecipes,
        pantryItems: nextPantryItems,
        aiRecipes: cached?.aiRecipes || []
      }));

    } catch (error) {
      console.error("Error loading test data:", error);
      setStatusMsg("Lỗi khi tải dữ liệu. Vui lòng kiểm tra kết nối local server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = sessionStorage.getItem("homechef_test_goal_cache");
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
        sessionStorage.setItem("homechef_test_goal_cache", JSON.stringify({
          user: nextUser,
          goal: nextGoal,
          recipes: recData || [],
          pantryItems: pantryItems,
          aiRecipes: cached?.aiRecipes || []
        }));

        setStatusMsg(`Đã cập nhật thực đơn phù hợp cho: ${getGoalLabel(targetGoal)}!`);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      setStatusMsg("Lỗi khi cập nhật mục tiêu sức khỏe.");
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
        setStatusMsg("Tủ lạnh của bạn đang trống! Vui lòng thêm nguyên liệu ở trang Tủ Lạnh.");
        setAiLoading(false);
        return;
      }

      const res = await generateAIRecommendations(ingredients);
      if (res.success || Array.isArray(res)) {
        // Depending on backend API response wrapping
        const data = Array.isArray(res) ? res : res.data;
        const finalData = data || [];
        setAiRecipes(finalData);
        setStatusMsg("Đã tạo gợi ý thực đơn từ Home Chef AI thành công!");

        // Update cache with new AI recommendations
        const currentCache = getCachedData() || {};
        sessionStorage.setItem("homechef_test_goal_cache", JSON.stringify({
          ...currentCache,
          aiRecipes: finalData
        }));
      }
    } catch (error) {
      console.error("AI Generation error:", error);
      setStatusMsg("Lỗi khi tạo công thức từ Home Chef AI.");
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
                      Mục tiêu hiện tại: <strong>{getGoalLabel(goal)}</strong>
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
                Thuật toán đã lọc nguyên liệu khớp và tự động sắp xếp theo tiêu chí:
                {goal === "lose_weight" && <strong> Lượng Calo thấp lên trước.</strong>}
                {goal === "gain_weight" && <strong> Lượng Calo và Protein cao lên trước.</strong>}
                {goal === "balanced" && <strong> Lượng Calo ổn định trung bình (~500 kcal).</strong>}
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
                              👉 <strong>Chi tiết:</strong> Chứa nguyên liệu trong tủ lạnh.
                              {goal === "lose_weight" && ` Phù hợp chế độ Giảm Cân vì năng lượng cung cấp thấp (${recipe.calories} kcal).`}
                              {goal === "gain_weight" && ` Phù hợp chế độ Tăng Cân nhờ lượng protein cực tốt (${recipe.protein}g) và calo cao (${recipe.calories} kcal).`}
                              {goal === "balanced" && ` Thích hợp dinh dưỡng Cân Bằng với mức calo lý tưởng (${recipe.calories} kcal).`}
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
                  setStatusMsg(`🔥 Đang chuẩn bị gia vị và nấu thử món: ${selectedRecipe.title}! Chúc bạn ngon miệng!`);
                  setSelectedRecipe(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                🍳 Bắt Đầu Nấu Thử
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestGoal;
