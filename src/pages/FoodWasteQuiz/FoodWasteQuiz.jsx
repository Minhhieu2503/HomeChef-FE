import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ChevronRight, AlertTriangle, ArrowLeft, Send, Sparkles, Award, Trash2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import "./FoodWasteQuiz.css";

const QUESTIONS = [
  {
    question: "Một hộ gia đình Việt Nam trung bình lãng phí bao nhiêu tiền thức ăn mỗi năm?",
    options: [
      "Khoảng 500.000đ",
      "Khoảng 2.000.000đ",
      "Lên tới 8.000.000đ",
      "Thực phẩm không đáng bao nhiêu tiền"
    ],
    correctAnswer: 2,
    explanation: "Theo nghiên cứu thống kê, một gia đình Việt Nam trung bình vứt bỏ lượng thực phẩm trị giá lên tới 8 triệu đồng mỗi năm do không sử dụng kịp và để hỏng."
  },
  {
    question: "Lượng rác thải thực phẩm toàn cầu đóng góp khoảng bao nhiêu phần trăm vào tổng lượng phát thải khí nhà kính?",
    options: [
      "Khoảng 1 - 2%",
      "Khoảng 8 - 10%",
      "Khoảng 20%",
      "Không gây phát thải"
    ],
    correctAnswer: 1,
    explanation: "Khí metan tỏa ra từ thực phẩm thừa phân hủy tại bãi rác chiếm tới 8-10% lượng phát thải nhà kính toàn cầu. Nếu rác thải thực phẩm là một quốc gia, nó sẽ đứng thứ 3 thế giới về lượng khí thải."
  },
  {
    question: "Giải pháp nào hiệu quả nhất giúp giảm 80% lượng thực phẩm bị lãng phí tại nhà?",
    options: [
      "Mua thật nhiều thực phẩm tích trữ",
      "Chỉ ăn đồ hộp, đồ đông lạnh",
      "Lên kế hoạch ăn uống (Meal Plan) & Quản lý hạn sử dụng tủ lạnh",
      "Chỉ nấu các món ăn cực kỳ đơn giản"
    ],
    correctAnswer: 2,
    explanation: "Sử dụng tính năng lên kế hoạch ăn uống (Meal Planner) từ 1-3 ngày của HomeChef và theo dõi sát sao ngày hết hạn trong tủ lạnh giúp bạn dùng tối ưu thực phẩm có sẵn, cắt giảm đến 80% rác thải thực phẩm!"
  }
];

function FoodWasteQuiz() {
  const toast = useToast();
  const navigate = useNavigate();
  
  // Quiz State
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  
  // Waitlist State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isWaitlistSubmitted, setIsWaitlistSubmitted] = useState(false);

  const handleOptionSelect = (idx) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleNextOrSubmit = () => {
    if (selectedOption === null) {
      toast.error("Vui lòng chọn một câu trả lời!");
      return;
    }

    if (!isSubmitted) {
      // Check answer
      if (selectedOption === QUESTIONS[currentQuestionIdx].correctAnswer) {
        setScore(prev => prev + 1);
        toast.success("Chính xác! 🎉");
      } else {
        toast.error("Rất tiếc, câu trả lời chưa đúng.");
      }
      setIsSubmitted(true);
    } else {
      // Go to next question or finish
      if (currentQuestionIdx < QUESTIONS.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedOption(null);
        setIsSubmitted(false);
      } else {
        setQuizFinished(true);
      }
    }
  };

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Vui lòng điền đầy đủ Họ tên và Email!");
      return;
    }
    setIsWaitlistSubmitted(true);
    toast.success("Đăng ký danh sách chờ Green VIP thành công! Cảm ơn đóng góp của bạn. 🌱");
  };

  return (
    <div className="waste-quiz-container">
      <header className="quiz-header-bar">
        <button className="back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={20} /> Quay lại
        </button>
        <div className="badge-green">
          <Sparkles size={16} /> HomeChef Eco-Challenge
        </div>
      </header>

      <main className="quiz-main-content">
        {!quizFinished ? (
          <div className="quiz-card animate-fadeIn">
            <div className="quiz-progress-bar">
              <div 
                className="quiz-progress-fill" 
                style={{ width: `${((currentQuestionIdx + (isSubmitted ? 1 : 0)) / QUESTIONS.length) * 100}%` }}
              ></div>
            </div>

            <div className="quiz-question-info">
              <span className="question-counter">Câu hỏi {currentQuestionIdx + 1}/{QUESTIONS.length}</span>
              <h2>{QUESTIONS[currentQuestionIdx].question}</h2>
            </div>

            <div className="quiz-options-list">
              {QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
                let optionClass = "option-item";
                if (selectedOption === idx) optionClass += " selected";
                
                if (isSubmitted) {
                  if (idx === QUESTIONS[currentQuestionIdx].correctAnswer) {
                    optionClass += " correct";
                  } else if (selectedOption === idx) {
                    optionClass += " incorrect";
                  } else {
                    optionClass += " disabled";
                  }
                }

                return (
                  <button 
                    key={idx} 
                    className={optionClass}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={isSubmitted}
                  >
                    <span className="option-index">{String.fromCharCode(65 + idx)}</span>
                    <span className="option-text">{option}</span>
                  </button>
                );
              })}
            </div>

            {isSubmitted && (
              <div className="explanation-box animate-slideIn">
                <h4>💡 Giải thích chi tiết:</h4>
                <p>{QUESTIONS[currentQuestionIdx].explanation}</p>
              </div>
            )}

            <button className="btn-next-question" onClick={handleNextOrSubmit}>
              {!isSubmitted ? "Kiểm tra câu trả lời" : currentQuestionIdx === QUESTIONS.length - 1 ? "Xem kết quả thử thách" : "Câu tiếp theo"}
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="quiz-results-view animate-fadeIn">
            {/* Results Certificate */}
            <div className="certificate-card">
              <div className="certificate-icon">
                <Award size={64} className="text-yellow-400" />
              </div>
              <h3>Thành Tựu Eco-Champion</h3>
              <p className="subtitle">Chúc mừng bạn đã hoàn thành thử thách kiến thức xanh!</p>
              
              <div className="score-badge">
                Bạn trả lời đúng <strong>{score}/{QUESTIONS.length}</strong> câu hỏi
              </div>

              <div className="impact-stats-grid">
                <div className="stat-card">
                  <div className="stat-emoji">💰</div>
                  <h4>Tiết kiệm chi tiêu</h4>
                  <p>Lên tới <strong>8.000.000đ/năm</strong> cho gia đình</p>
                </div>
                <div className="stat-card">
                  <div className="stat-emoji">🌳</div>
                  <h4>Bảo vệ môi trường</h4>
                  <p>Giảm phát thải khí tương đương trồng <strong>24 cây xanh</strong></p>
                </div>
              </div>
            </div>

            {/* Comic Strip Section */}
            <div className="comic-section-card">
              <h3>🎨 Nhật Ký Của Bạn Cà Chua Nhỏ</h3>
              <p className="comic-desc">Hành trình lãng quên trong góc tủ lạnh và giải pháp giải cứu thông minh!</p>
              
              <div className="comic-image-container">
                <img 
                  src="food_waste_comic.png" 
                  alt="Food Waste Comic Strip" 
                  className="comic-image"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800";
                  }}
                />
              </div>
            </div>

            {/* Premium Waitlist registration form */}
            <div className="waitlist-card">
              <div className="waitlist-header">
                <div className="leaf-badge">🌱 Join the Green VIP Club</div>
                <h3>Đăng Ký Danh Sách Chờ Green VIP</h3>
                <p>Nhận ngay thông báo khi HomeChef cập nhật các tính năng siêu thông minh về chống lãng phí thực phẩm và tối ưu tủ lạnh.</p>
              </div>

              {!isWaitlistSubmitted ? (
                <form onSubmit={handleWaitlistSubmit} className="waitlist-form">
                  <div className="form-group">
                    <label>Họ và Tên</label>
                    <input 
                      type="text" 
                      placeholder="Nhập họ tên của bạn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email liên hệ</label>
                    <input 
                      type="email" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại (Không bắt buộc)</label>
                    <input 
                      type="tel" 
                      placeholder="09xx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  
                  <button type="submit" className="btn-submit-waitlist">
                    <Send size={16} /> Đăng Ký Green VIP Club
                  </button>
                </form>
              ) : (
                <div className="waitlist-success animate-popIn">
                  <CheckCircle2 size={48} className="text-green-500" />
                  <h4>Đăng ký thành công!</h4>
                  <p>Cảm ơn <strong>{name}</strong> đã đồng hành cùng HomeChef trong hành trình bảo vệ môi trường & tiết kiệm thực phẩm.</p>
                  <button className="btn-back-home" onClick={() => navigate("/")}>
                    Về trang chủ
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default FoodWasteQuiz;
