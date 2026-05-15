import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./RecipeCooking.css";

const RecipeCooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const recipe = location.state?.recipe;
  
  const [currentStep, setCurrentStep] = useState(0);
  const steps = recipe?.steps || [
    { instruction: "Prepare all ingredients and wash vegetables." },
    { instruction: "Heat oil in a large pan over medium heat." },
    { instruction: "Add onions and sauté until translucent." }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      alert("🎉 Cooking Complete! Enjoy your meal.");
      navigate(`/recipes/${id}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!recipe) return <div className="p-4">Loading recipe steps...</div>;

  return (
    <div className="cooking-mode-overlay">
      {/* TOP PROGRESS BAR */}
      <div className="cooking-progress-container">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="step-counter">Step {currentStep + 1} of {steps.length}</div>
      </div>

      <button className="exit-cooking-btn" onClick={() => navigate(`/recipes/${id}`)}>✕</button>

      {/* HERO IMAGE (40% HEIGHT) */}
      <div className="cooking-hero-image">
        <img src={recipe.image || "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800"} alt="Step" />
        <div className="voice-indicator">
          <span className="mic-icon">🎤</span>
          <span className="status-text">Listening...</span>
        </div>
      </div>

      {/* LARGE INSTRUCTION AREA */}
      <div className="cooking-instruction-card">
        <div className="instruction-content">
          <p className="step-label">Instruction</p>
          <h2 className="step-text">{steps[currentStep].instruction}</h2>
        </div>
      </div>

      {/* BOTTOM NAVIGATION (FULL WIDTH BUTTONS) */}
      <div className="cooking-nav-controls">
        <button className="btn-nav prev" onClick={prevStep} disabled={currentStep === 0}>
          Previous
        </button>
        <button className="btn-nav next" onClick={nextStep}>
          {currentStep === steps.length - 1 ? "Finish" : "Next Step"}
        </button>
      </div>
    </div>
  );
};

export default RecipeCooking;
