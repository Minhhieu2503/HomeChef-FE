import { useState, useEffect } from "react";
import { authService } from "../../services/auth.service";
import { getRecommendedRecipes, generateAIRecommendations } from "../../services/recipeService";
import { getPantryItems } from "../../services/pantryService";
import "./TestGoal.css";

function TestGoal() {
  const [user, setUser] = useState(null);
  const [goal, setGoal] = useState("balanced");
  const [recipes, setRecipes] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecipes, setAiRecipes] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, pantryData] = await Promise.all([
        authService.getMe(),
        getPantryItems()
      ]);

      if (profileRes.success) {
        setUser(profileRes.data);
        setGoal(profileRes.data.healthGoal || "balanced");
        
        // Fetch recommendations with cache bypassed
        const recData = await getRecommendedRecipes(true);
        setRecipes(recData || []);
      }

      setPantryItems(pantryData || []);
    } catch (error) {
      console.error("Error loading test data:", error);
      setStatusMsg("Lỗi khi tải dữ liệu. Vui lòng kiểm tra kết nối local server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGoalChange = async (targetGoal) => {
    try {
      setUpdating(true);
      setStatusMsg(`Đang cập nhật mục tiêu sang: ${getGoalLabel(targetGoal)}...`);
      
      const res = await authService.updateProfile({ healthGoal: targetGoal });
      if (res.success) {
        setUser(res.data);
        setGoal(res.data.healthGoal);
        setStatusMsg(`Đã cập nhật mục tiêu! Đang tải lại danh sách món ăn gợi ý...`);

        // Fetch recommendations with cache bypassed
        const recData = await getRecommendedRecipes(true);
        setRecipes(recData || []);
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
      setStatusMsg("Gemini AI đang phân tích tủ lạnh và mục tiêu sức khỏe để thiết kế món ăn...");
      
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
        setAiRecipes(data || []);
        setStatusMsg("Đã tạo gợi ý thực đơn từ Gemini AI thành công!");
      }
    } catch (error) {
      console.error("AI Generation error:", error);
      setStatusMsg("Lỗi khi tạo công thức từ Gemini AI.");
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
          Kiểm thử nhanh thuật toán phân bổ calo/dinh dưỡng và prompt Gemini AI theo 3 mục tiêu sức khỏe.
        </p>
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

            <div className="panel-card goal-selector-card">
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
              <h2>Kiểm Thử Đề Xuất Gemini AI</h2>
              <p className="panel-instruction">
                Gemini AI sẽ nhận danh sách nguyên liệu và mục tiêu sức khỏe hiện tại là <strong>{getGoalLabel(goal)}</strong> để sáng tạo các món ăn phù hợp.
              </p>
              <button 
                onClick={triggerAISuggestions} 
                className="btn-trigger-ai"
                disabled={aiLoading || pantryItems.length === 0}
              >
                {aiLoading ? "Đang gửi Prompt tới Gemini AI..." : "🚀 Kích Hoạt Đề Xuất Gemini AI"}
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
                      <div key={recipe._id} className={`recipe-result-item ${isOptimal ? "optimal" : ""}`}>
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
                  <h2>Kết Quả Gemini AI Trả Về (Sáng Tạo)</h2>
                  <span className="results-count ai-count">{aiRecipes.length} công thức sáng tạo</span>
                </div>
                <p className="panel-instruction">
                  Danh sách món ăn được Gemini thiết kế theo mục tiêu <strong>{getGoalLabel(goal)}</strong>:
                </p>

                <div className="recipe-results-list">
                  {aiRecipes.map((recipe, index) => (
                    <div key={index} className="recipe-result-item ai-item">
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
                          <strong>Nguyên liệu phối hợp:</strong> {recipe.ingredients?.map(i => i.name).join(", ")}
                        </div>
                      </div>
                    </div>
                  ))}
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
