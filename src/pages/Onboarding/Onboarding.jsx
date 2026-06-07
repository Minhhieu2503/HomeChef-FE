import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authUtils } from "../../utils/authUtils";
import "./Onboarding.css";

const slides = [
  {
    title: "Khám phá hàng ngàn công thức",
    desc: "Tìm kiếm và lưu trữ những công thức nấu ăn ngon miệng, phù hợp với sở thích của bạn.",
    img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Lên kế hoạch ăn uống dễ dàng",
    desc: "Sắp xếp thực đơn hàng tuần thông minh, giúp bạn kiểm soát lượng calo và dinh dưỡng.",
    img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1000&auto=format&fit=crop"
  },
  {
    title: "Quản lý nguyên liệu thông minh",
    desc: "Theo dõi tủ lạnh và tự động tạo danh sách mua sắm cực kỳ tiện lợi.",
    img: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop"
  }
];

function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, skip onboarding
    if (authUtils.isAuthenticated()) {
      localStorage.setItem("hasSeenOnboarding", "true");
      navigate("/");
    }
  }, [navigate]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    // If logged in, go to dashboard, otherwise go to login
    if (authUtils.isAuthenticated()) {
      navigate("/");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-image-section">
        {slides.map((slide, index) => (
          <img 
            key={index}
            src={slide.img} 
            alt="Onboarding feature" 
            className="onboarding-image"
            onError={(e) => { e.target.style.opacity = '0'; e.target.style.display = 'none'; }}
            style={{ 
              opacity: currentSlide === index ? 1 : 0,
              position: currentSlide === index ? "relative" : "absolute",
              top: 0,
              left: 0
            }}
          />
        ))}
        <div className="onboarding-gradient-overlay"></div>
      </div>

      <div className="onboarding-content-section">
        <div className="onboarding-indicators">
          {slides.map((_, index) => (
            <div 
              key={index} 
              className={`indicator ${currentSlide === index ? "active" : ""}`}
              onClick={() => setCurrentSlide(index)}
            ></div>
          ))}
        </div>

        <div className="onboarding-text-wrap">
          <h1 className="onboarding-title">{slides[currentSlide].title}</h1>
          <p className="onboarding-desc">{slides[currentSlide].desc}</p>
        </div>

        <div className="onboarding-actions">
          <button className="onboarding-btn btn-large-primary" onClick={handleNext}>
            {currentSlide === slides.length - 1 ? "Bắt đầu ngay" : "Tiếp tục"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
