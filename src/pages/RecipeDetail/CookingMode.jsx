import { useState, useEffect } from "react";
import "./CookingMode.css";

function CookingMode({ recipe, onClose, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const totalSteps = recipe.steps ? recipe.steps.length : 0;
  const currentStep = recipe.steps ? recipe.steps[currentStepIndex] : null;

  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      if (isMuted || !text) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (err) {}
  };

  useEffect(() => {
    if (currentStep && !isMuted) {
      speakText(currentStep.instruction || currentStep.text || currentStep);
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [currentStepIndex, isMuted]);

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete();
    }
  };

  if (!currentStep) return null;

  return (
    <div className="hands-free-overlay">
      {/* TOP PROGRESS */}
      <div className="cooking-header">
        <div className="progress-bar-modern">
          <div className="fill" style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}></div>
        </div>
        <div className="header-top-row">
          <button className="btn-close-cooking" onClick={onClose}>✕</button>
          <span className="step-count">Step {currentStepIndex + 1} of {totalSteps}</span>
          <button className="btn-mute" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {/* HERO IMAGE OR VIDEO (40%) */}
      <div className="cooking-visual">
        {currentStep.video ? (
          <div className="visual-wrapper">
             {currentStep.video.includes('youtube.com') || currentStep.video.includes('youtu.be') ? (
              <iframe 
                className="visual-iframe"
                src={currentStep.video.replace('watch?v=', 'embed/').split('&')[0]} 
                title="Step Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <video controls autoPlay muted loop className="visual-video">
                <source src={currentStep.video} type="video/mp4" />
              </video>
            )}
          </div>
        ) : (
          <img src={currentStep.image || recipe.image} alt="Cooking" className="visual-img" />
        )}
        
        <div className="listening-badge">
          <div className="pulse-icon">🎤</div>
          <span className="label">Listening</span>
        </div>
      </div>

      {/* TYPOGRAPHY AREA */}
      <div className="instruction-focus-area">
        <div className="instruction-content">
          <p className="instruction-label">Instruction</p>
          <h1 className="instruction-main-text">
            {currentStep.instruction || currentStep.text || currentStep}
          </h1>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="cooking-footer-nav">
        <button 
          className="nav-btn prev" 
          disabled={currentStepIndex === 0}
          onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
        >
          Previous
        </button>
        <button className="nav-btn next" onClick={handleNext}>
          {currentStepIndex === totalSteps - 1 ? "Finish Cooking" : "Next Step"}
        </button>
      </div>
    </div>
  );
}

export default CookingMode;
