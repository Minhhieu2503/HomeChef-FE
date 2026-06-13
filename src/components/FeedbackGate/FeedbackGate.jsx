import React, { useState } from "react";
import { feedbackService } from "../../services/feedback.service";
import { authUtils } from "../../utils/authUtils";
import { useToast } from "../../context/ToastContext";
import { Star, Bug, Lightbulb, MessageSquare, HelpCircle, LogOut, Send } from "lucide-react";
import "./FeedbackGate.css";

const FeedbackGate = ({ user, onUnlock }) => {
  const toast = useToast();
  const [ratingUI, setRatingUI] = useState(0);
  const [hoverUI, setHoverUI] = useState(0);
  
  const [ratingSpeed, setRatingSpeed] = useState(0);
  const [hoverSpeed, setHoverSpeed] = useState(0);
  
  const [ratingContent, setRatingContent] = useState(0);
  const [hoverContent, setHoverContent] = useState(0);

  const [type, setType] = useState("general");
  const [comment, setComment] = useState("");
  const [agreeUpgradePremium, setAgreeUpgradePremium] = useState("");
  const [loading, setLoading] = useState(false);

  const feedbackTypes = [
    { id: "general", label: "Góp ý chung", icon: <MessageSquare size={16} /> },
    { id: "bug", label: "Báo lỗi", icon: <Bug size={16} /> },
    { id: "feature", label: "Tính năng mới", icon: <Lightbulb size={16} /> },
    { id: "other", label: "Khác", icon: <HelpCircle size={16} /> },
  ];

  const handleLogout = () => {
    authUtils.removeToken();
    sessionStorage.removeItem("justRegistered");
    window.location.hash = "#/login";
    window.location.reload();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (ratingUI === 0 || ratingSpeed === 0 || ratingContent === 0) {
      toast.error("Vui lòng đánh giá đầy đủ cả 3 tiêu chí của ứng dụng.");
      return;
    }
    if (!agreeUpgradePremium) {
      toast.error("Vui lòng trả lời câu hỏi khảo sát nâng cấp Premium.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung góp ý chi tiết.");
      return;
    }

    setLoading(true);
    try {
      const res = await feedbackService.submitFeedback({ 
        type, 
        ratingUI, 
        ratingSpeed, 
        ratingContent, 
        comment,
        agreeUpgradePremium
      });
      
      if (res.success) {
        toast.success(res.message || "Cảm ơn bạn đã đóng góp ý kiến!");
        const updatedUser = res.data.user;
        authUtils.setUser(updatedUser);
        onUnlock(updatedUser);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Gửi phản hồi thất bại.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderStarRow = (title, rating, setRating, hoverRating, setHoverRating) => {
    const getRatingLabel = (score) => {
      switch (score) {
        case 5: return "Tuyệt vời 😍";
        case 4: return "Tốt 🙂";
        case 3: return "Bình thường 😐";
        case 2: return "Chưa tốt 🙁";
        case 1: return "Tệ 😡";
        default: return "Chưa đánh giá";
      }
    };

    return (
      <div className="detail-rating-row">
        <div className="rating-row-info">
          <span className="rating-row-title">{title}</span>
          <span className="rating-row-score-label">{getRatingLabel(hoverRating || rating)}</span>
        </div>
        <div className="star-rating-container-small">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn-small ${
                star <= (hoverRating || rating) ? "filled" : ""
              }`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <Star 
                size={22} 
                fill={star <= (hoverRating || rating) ? "var(--color-primary, #4ADE80)" : "none"} 
                color={star <= (hoverRating || rating) ? "var(--color-primary, #4ADE80)" : "#cbd5e1"} 
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="feedback-gate-overlay">
      <div className="feedback-gate-card animate-popIn">
        <div className="feedback-gate-header">
          <div className="feedback-logo-container">👨‍🍳</div>
          <h2>Chia sẻ trải nghiệm của bạn!</h2>
          <p>
            Ý kiến đóng góp chi tiết của bạn sẽ giúp đội ngũ <strong>HomeChef</strong> hoàn thiện hệ thống và nâng cao chất lượng dịch vụ.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-gate-form">
          {/* Feedback Type Selector */}
          <div className="feedback-form-group">
            <label className="group-label">Bạn muốn góp ý về phần nào?</label>
            <div className="type-chips">
              {feedbackTypes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`type-chip ${type === item.id ? "active" : ""}`}
                  onClick={() => setType(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="feedback-form-group detailed-ratings-section">
            <label className="group-label">Đánh giá các khía cạnh hệ thống</label>
            
            {renderStarRow("Giao diện & Tiện dụng", ratingUI, setRatingUI, hoverUI, setHoverUI)}
            {renderStarRow("Tốc độ & Trải nghiệm", ratingSpeed, setRatingSpeed, hoverSpeed, setHoverSpeed)}
            {renderStarRow("Công thức & Nội dung", ratingContent, setRatingContent, hoverContent, setHoverContent)}
          </div>

          {/* Comment input */}
          <div className="feedback-form-group">
            <label className="group-label">Góp ý chi tiết của bạn</label>
            <textarea
              className="feedback-textarea"
              placeholder="Vui lòng nêu cụ thể những trải nghiệm, cảm nhận của bạn về hệ thống hoặc các ý kiến góp ý tại đây..."
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          {/* Premium Upgrade Survey */}
          <div className="feedback-form-group">
            <label className="group-label">Bạn có đồng ý nâng cấp premium sau khi dùng thử không?</label>
            <div className="premium-upgrade-options">
              <button
                type="button"
                className={`upgrade-option-btn yes ${agreeUpgradePremium === "yes" ? "active" : ""}`}
                onClick={() => setAgreeUpgradePremium("yes")}
              >
                👍 Đồng ý nâng cấp
              </button>
              <button
                type="button"
                className={`upgrade-option-btn no ${agreeUpgradePremium === "no" ? "active" : ""}`}
                onClick={() => setAgreeUpgradePremium("no")}
              >
                👎 Không, cảm ơn
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="feedback-actions">
            <button
              type="submit"
              className="btn-feedback-submit"
              disabled={loading || ratingUI === 0 || ratingSpeed === 0 || ratingContent === 0 || !comment.trim() || !agreeUpgradePremium}
            >
              {loading ? (
                "Đang gửi phản hồi..."
              ) : (
                <>
                  <span>Gửi góp ý và tiếp tục sử dụng</span>
                  <Send size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-feedback-logout"
              onClick={handleLogout}
            >
              <LogOut size={14} />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackGate;
