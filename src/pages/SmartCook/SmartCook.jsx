import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SmartCook.css";

function SmartCook() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Data passed from Pantry scanner
  const scanData = location.state?.scanData;
  
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showCalorieModal, setShowCalorieModal] = useState(false);

  // If accessed directly without data, go back to pantry
  if (!scanData) {
    return (
      <div className="smartcook-error">
        <h2>Không tìm thấy dữ liệu</h2>
        <button className="btn btn-primary" onClick={() => navigate("/pantry")}>Quay lại Tủ lạnh</button>
      </div>
    );
  }

  const { ingredients, recipes } = scanData;

  const handleStartCooking = (recipe) => {
    setSelectedRecipe(recipe);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < selectedRecipe.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowCalorieModal(true);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setShowCalorieModal(false);
    navigate("/pantry"); // Go back to pantry after finishing
  };

  return (
    <div className="smartcook-page mobile-premium">
      {/* If no recipe selected, show ingredients and suggestions */}
      {!selectedRecipe ? (
        <div className="smartcook-suggestions">
          <div className="page-header simple-header">
            <button className="back-btn" onClick={() => navigate("/pantry")}>←</button>
            <h1>Nguyên liệu tìm thấy</h1>
          </div>
          
          <div className="sc-ingredients-list">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="sc-ingredient-tag">
                {ing.emoji} {ing.name} ({ing.quantity})
              </div>
            ))}
          </div>

          <h2 className="sc-section-title">✨ Món ngon gợi ý cho bạn</h2>
          <div className="sc-recipes-grid">
            {recipes.map(recipe => (
              <div key={recipe.id} className="sc-recipe-card" onClick={() => handleStartCooking(recipe)}>
                <img src={recipe.image} alt={recipe.title} className="sc-recipe-img" />
                <div className="sc-recipe-info">
                  <h3>{recipe.title}</h3>
                  <div className="sc-recipe-meta">
                    <span>⏱ {recipe.cookTime} phút</span>
                    <span>🔥 {recipe.calories} kcal</span>
                    <span>⭐ {recipe.difficulty}</span>
                  </div>
                  <button className="btn btn-sunset sc-cook-btn">Bắt đầu nấu</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Cooking Mode */
        <div className="smartcook-cooking-mode">
          <div className="sc-cooking-header">
            <button className="back-btn" onClick={() => setSelectedRecipe(null)}>←</button>
            <h2>{selectedRecipe.title}</h2>
          </div>

          <div className="sc-step-container">
            <div className="sc-step-progress">
              Bước {currentStep + 1} / {selectedRecipe.steps.length}
            </div>
            
            <div className="sc-step-card">
              <div className="sc-step-number">{currentStep + 1}</div>
              <p className="sc-step-instruction">
                {selectedRecipe.steps[currentStep].instruction}
              </p>
            </div>

            <div className="sc-step-controls">
              <button 
                className={`btn sc-nav-btn ${currentStep === 0 ? "disabled" : ""}`} 
                onClick={prevStep}
              >
                Trước
              </button>
              <button 
                className="btn btn-primary sc-nav-btn" 
                onClick={nextStep}
              >
                {currentStep === selectedRecipe.steps.length - 1 ? "Hoàn thành" : "Tiếp theo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calorie Modal */}
      {showCalorieModal && (
        <div className="sc-modal-overlay">
          <div className="sc-modal-content">
            <div className="sc-modal-icon">🎉</div>
            <h2>Chúc mừng!</h2>
            <p>Bạn đã hoàn thành món <strong>{selectedRecipe.title}</strong></p>
            
            <div className="sc-calorie-circle">
              <span className="sc-calorie-amount">{selectedRecipe.calories}</span>
              <span className="sc-calorie-label">Kcal</span>
            </div>
            
            <p className="sc-modal-desc">Bữa ăn tuyệt vời đã sẵn sàng. Chúc bạn ngon miệng!</p>
            
            <button className="btn btn-primary sc-modal-btn" onClick={handleFinish}>
              Tuyệt vời
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartCook;
