import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X, Check, Clock, Lightbulb, ArrowLeft, ArrowRight } from "lucide-react";
import "./CookingMode.css";

function CookingMode({ recipe, onClose, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [handsFree, setHandsFree] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // Custom modal states to replace browser alert
  const [activeTip, setActiveTip] = useState(null);
  const [showTimerAlert, setShowTimerAlert] = useState(false);
  
  // Voice recognition reference
  const recognitionRef = useRef(null);

  // Helper to format image URLs
  const getImageUrl = (url) => {
    if (!url) return "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800";
    if (url.startsWith("http")) return url;
    const apiUrl = import.meta.env.VITE_API_URL || "https://homechef-be-earg.onrender.com/api";
    const baseUrl = apiUrl.replace("/api", "");
    return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800";
  };

  const totalSteps = recipe.steps ? recipe.steps.length : 0;
  const currentStep = recipe.steps ? recipe.steps[currentStepIndex] : null;
  const stepText = currentStep ? (currentStep.instruction || currentStep.text || currentStep) : "";

  // Text-To-Speech (TTS)
  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      if (isMuted || !text) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("TTS Error:", err);
    }
  };

  // Text-To-Speech trigger on step change
  useEffect(() => {
    if (stepText) {
      speakText(stepText);
    }
    // Parse step duration to suggest timer
    resetTimerForStep(stepText);

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [currentStepIndex, isMuted]);

  // Voice Command Listener (Speech-To-Text)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition && handsFree) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "vi-VN";

        recognition.onstart = () => {
          setIsListening(true);
          console.log("Speech recognition started...");
        };

        recognition.onresult = (event) => {
          const lastResultIndex = event.results.length - 1;
          const command = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
          console.log('Heard command:', command);

          if (command.includes("tiếp") || command.includes("sau") || command.includes("next")) {
            handleNext();
          } else if (command.includes("trước") || command.includes("quay lại") || command.includes("back") || command.includes("lùi")) {
            handlePrev();
          }
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
          // Restart if handsFree switch is still true
          if (handsFree) {
            try {
              recognition.start();
            } catch (e) {}
          } else {
            setIsListening(false);
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.error("SpeechRecognition initialization failed:", err);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [handsFree, currentStepIndex]);

  // Countdown timer logic
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            playTimerAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [timerActive, timerSeconds]);

  const playTimerAlert = () => {
    try {
      // Sound alert using browser audio synthesis or simple beep
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1); // 1 second beep
      
      setShowTimerAlert(true);
    } catch (e) {
      setShowTimerAlert(true);
    }
  };

  const resetTimerForStep = (text) => {
    clearInterval(timerRef.current);
    setTimerActive(false);
    
    // Parse duration from text (e.g. "30 phút", "10 phút", "5 phút")
    const match = text.match(/(\d+)\s*phút/i);
    if (match) {
      setTimerSeconds(parseInt(match[1]) * 60);
    } else {
      setTimerSeconds(null);
    }
  };

  const startCountdown = () => {
    if (timerSeconds && timerSeconds > 0) {
      setTimerActive(!timerActive);
    } else {
      // Default to 10 minutes if no duration is parsed
      setTimerSeconds(10 * 60);
      setTimerActive(true);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const showHelpTip = () => {
    const tips = [
      "Đảm bảo nhiệt độ bếp vừa phải để không làm cháy lớp gia vị bên ngoài.",
      "Bạn có thể dùng đầu tăm xiên qua thịt để kiểm tra xem đã chín hẳn chưa.",
      "Để sườn ngấm đều, nên lật mặt sườn ít nhất một lần trong quá trình chế biến.",
      "Nước xốt có xu hướng cô đặc nhanh, hãy giữ lửa nhỏ liu riu."
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setActiveTip(randomTip);
  };

  const formatTime = (secs) => {
    if (secs === null) return "";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Nutrition parsing
  const calories = recipe.calories || 540;
  const protein = recipe.nutrition?.protein || "32g";
  const carbs = recipe.nutrition?.carbs || "45g";
  const fat = recipe.nutrition?.fat || "18g";

  return (
    <div className="cooking-mode-fullscreen">
      {/* HEADER */}
      <header className="cooking-mode-header">
        <div className="header-brand">
          <span className="logo-utensils">🍳</span>
          <span className="brand-text">HomeChef <span>| Chế độ Nấu ăn</span></span>
        </div>
        <div className="header-recipe-info">
          <span className="recipe-title">{recipe.title}</span>
          <span className="step-indicator">Bước {currentStepIndex + 1} trên {totalSteps}</span>
        </div>
        <button className="exit-btn" onClick={onClose} title="Thoát chế độ nấu ăn">
          <X size={20} />
        </button>
      </header>

      {/* MAIN LAYOUT */}
      <div className="cooking-main-layout">
        
        {/* LEFT COLUMN: Media & Stats */}
        <div className="left-column">
          {/* Main Visual Image */}
          <div className="media-container">
            <img 
              src={getImageUrl((currentStep && currentStep.image) || recipe.image)} 
              alt={recipe.title} 
              className="cooking-hero-img" 
              onError={handleImageError}
            />
            <div className="cook-time-badge">
              ⏱ {recipe.cookTime || 45} phút
            </div>
          </div>

          {/* Widgets Row */}
          <div className="widgets-row">
            {/* Nutrition Widget */}
            <div className="widget-card nutrition-widget">
              <div className="nutrition-donut-container">
                <div className="donut-chart-css">
                  <div className="donut-center-hole">
                    <span className="cal-val">{calories}</span>
                    <span className="cal-lbl">KCAL</span>
                  </div>
                </div>
              </div>
              <div className="nutrition-details">
                <div className="nut-item">
                  <span className="dot dot-protein"></span>
                  <span className="nut-lbl">Protein:</span>
                  <span className="nut-val">{protein}</span>
                </div>
                <div className="nut-item">
                  <span className="dot dot-carbs"></span>
                  <span className="nut-lbl">Tinh bột:</span>
                  <span className="nut-val">{carbs}</span>
                </div>
                <div className="nut-item">
                  <span className="dot dot-fat"></span>
                  <span className="nut-lbl">Chất béo:</span>
                  <span className="nut-val">{fat}</span>
                </div>
              </div>
            </div>

            {/* Hands-free Microphone Widget */}
            <div className="widget-card hands-free-widget">
              <div className="widget-header">
                <span className="widget-title">Rảnh tay</span>
                <label className="mint-switch">
                  <input 
                    type="checkbox" 
                    checked={handsFree} 
                    onChange={() => setHandsFree(!handsFree)} 
                  />
                  <span className="mint-slider"></span>
                </label>
              </div>
              <div className="mic-container-wrapper">
                <div className={`mic-circle ${isListening ? "pulse-active" : ""}`}>
                  {isListening ? (
                    <Mic size={28} className="text-white animate-pulse" />
                  ) : (
                    <MicOff size={28} style={{ color: "#94a3b8" }} />
                  )}
                </div>
                <div className="status-label">
                  {isListening ? (
                    <>
                      <p className="status-main text-emerald-500">Đang lắng nghe...</p>
                      <p className="status-sub">Nói "Tiếp theo" hoặc "Quay lại"</p>
                    </>
                  ) : (
                    <>
                      <p className="status-main text-slate-400">Rảnh tay tắt</p>
                      <p className="status-sub">Bật switch để dùng giọng nói</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="right-column">
          {/* Section: Ingredients */}
          <section className="ingredients-section">
            <h3 className="section-title">
              <span className="icon-basket">🧺</span> Nguyên liệu cần dùng
            </h3>
            <div className="ingredients-grid">
              {(recipe.ingredients || []).map((ing, idx) => {
                const name = ing.name || ing;
                const qty = ing.quantity || ing.qty || "";
                const unit = ing.unit || "";
                const displayQty = qty ? `${qty} ${unit}`.trim() : "";
                
                return (
                  <div 
                    key={idx} 
                    className={`ingredient-checkbox-card ${checkedIngredients[idx] ? "checked" : ""}`}
                    onClick={() => toggleIngredient(idx)}
                  >
                    <div className="checkbox-outer">
                      <div className="checkbox-inner">
                        {checkedIngredients[idx] && <Check size={14} style={{ color: "white" }} />}
                      </div>
                    </div>
                    <div className="ing-info">
                      <span className="ing-name-txt">{name}</span>
                      {displayQty && <span className="ing-qty-txt">{displayQty}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section: Active Step Card */}
          <section className="steps-section">
            <h3 className="section-title">
              <span className="icon-book">📖</span> Các bước thực hiện
            </h3>
            <div className="active-step-card">
              <div className="step-card-header">
                <span className="step-badge">{currentStepIndex + 1}</span>
                <span className="step-status-tag">ĐANG THỰC HIỆN</span>
              </div>
              <div className="step-text-container">
                <p className="step-instruction-large">{stepText}</p>
              </div>

              {/* Action Buttons Row */}
              <div className="step-action-buttons">
                <button 
                  className={`btn-step-action timer-btn ${timerActive ? "active" : ""}`} 
                  onClick={startCountdown}
                >
                  <Clock size={16} /> 
                  <span>
                    {timerActive 
                      ? `Hẹn giờ: ${formatTime(timerSeconds)}` 
                      : timerSeconds 
                        ? `Đặt hẹn giờ: ${Math.round(timerSeconds / 60)}p` 
                        : "Đặt hẹn giờ"
                    }
                  </span>
                </button>
                <button className="btn-step-action tip-btn" onClick={showHelpTip}>
                  <Lightbulb size={16} /> Mẹo hay
                </button>
              </div>
            </div>

            {currentStepIndex < totalSteps - 1 && (
              <div className="next-step-preview-card">
                <div className="next-step-header">
                  <span className="next-step-badge">{currentStepIndex + 2}</span>
                  <span className="next-step-label">TIẾP THEO</span>
                </div>
                <p className="next-step-instruction">
                  {recipe.steps[currentStepIndex + 1].instruction || recipe.steps[currentStepIndex + 1].text || recipe.steps[currentStepIndex + 1]}
                </p>
              </div>
            )}
          </section>
        </div>

      </div>

      {/* BOTTOM PROGRESS & NAVIGATION BAR */}
      <footer className="cooking-bottom-bar">
        {/* Progress Track */}
        <div className="cooking-progress-track">
          <div 
            className="cooking-progress-fill" 
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          ></div>
        </div>

        {/* Navigation buttons */}
        <div className="nav-buttons-container">
          <button 
            className="nav-action-btn prev-step-btn" 
            onClick={handlePrev} 
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft size={18} />
            <span>Bước trước</span>
          </button>
          
          <button className="nav-action-btn next-step-btn" onClick={handleNext}>
            <span>
              {currentStepIndex === totalSteps - 1 ? "Hoàn thành" : "Bước tiếp theo"}
            </span>
            <ArrowRight size={18} />
          </button>
        </div>
      </footer>

      {/* TIP MODAL */}
      {activeTip && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-card tip-card">
            <div className="alert-icon-wrapper tip-icon-bg">
              <span className="alert-emoji">💡</span>
            </div>
            <h4 className="alert-title">Mẹo hay nhà bếp</h4>
            <p className="alert-message">{activeTip}</p>
            <button className="alert-close-btn tip-theme-btn" onClick={() => setActiveTip(null)}>
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* TIMER ALERT MODAL */}
      {showTimerAlert && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-card alarm-card">
            <div className="alert-icon-wrapper alarm-icon-bg">
              <span className="alert-emoji animate-bounce">⏱️</span>
            </div>
            <h4 className="alert-title">Hết giờ rồi!</h4>
            <p className="alert-message">Thời gian nấu cho bước này đã hoàn tất. Hãy kiểm tra thức ăn nhé!</p>
            <button className="alert-close-btn alarm-theme-btn" onClick={() => setShowTimerAlert(false)}>
              Xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CookingMode;
