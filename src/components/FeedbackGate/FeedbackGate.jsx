import React, { useState } from "react";
import { feedbackService } from "../../services/feedback.service";
import { authUtils } from "../../utils/authUtils";
import { useToast } from "../../context/ToastContext";
import { Star, Bug, Lightbulb, MessageSquare, HelpCircle, LogOut, Send } from "lucide-react";
import "./FeedbackGate.css";

const FeedbackGate = ({ user, onUnlock }) => {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [type, setType] = useState("general");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const feedbackTypes = [
    { id: "general", label: "Góp ý chung", icon: <MessageSquare size={16} /> },
    { id: "bug", label: "Báo lỗi", icon: <Bug size={16} /> },
    { id: "feature", label: "Tính năng mới", icon: <Lightbulb size={16} /> },
    { id: "other", label: "Khác", icon: <HelpCircle size={16} /> },
  ];

  const handleLogout = () => {
    authUtils.removeToken();
    window.location.hash = "#/login";
    window.location.reload();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Vui lòng đánh giá số sao trước khi gửi.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung góp ý.");
      return;
    }

    setLoading(true);
    try {
      const res = await feedbackService.submitFeedback({ type, rating, comment });
      if (res.success) {
        toast.success(res.message || "Cảm ơn bạn đã đóng góp ý kiến!");
        // Update user state in localStorage
        const updatedUser = res.data.user;
        authUtils.setUser(updatedUser);
        // Unlock application
        onUnlock(updatedUser);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Gửi phản hồi thất bại.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-gate-overlay">
      <div className="feedback-gate-card animate-popIn">
        <div className="feedback-gate-header">
          <div className="feedback-logo-container">👨‍🍳</div>
          <h2>Chia sẻ trải nghiệm của bạn!</h2>
          <p>
            Ý kiến của bạn là động lực giúp đội ngũ <strong>HomeChef</strong> phát triển các công thức và tính năng tốt hơn mỗi ngày.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-gate-form">
          {/* Feedback Type Selector */}
          <div className="feedback-form-group">
            <label className="group-label">Bạn muốn góp ý về điều gì?</label>
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

          {/* Star Rating */}
          <div className="feedback-form-group text-center">
            <label className="group-label">Đánh giá độ hài lòng của bạn</label>
            <div className="star-rating-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${
                    star <= (hoverRating || rating) ? "filled" : ""
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  title={`${star} sao`}
                >
                  <Star size={36} fill={star <= (hoverRating || rating) ? "var(--color-primary, #10b981)" : "none"} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <span className="rating-desc">
                {rating === 5
                  ? "Rất tuyệt vời! 😍"
                  : rating === 4
                  ? "Tốt và hài lòng! 🙂"
                  : rating === 3
                  ? "Bình thường / Tạm ổn. 😐"
                  : rating === 2
                  ? "Chưa tốt, cần cải thiện. 🙁"
                  : "Rất tệ / Cần sửa đổi gấp! 😡"}
              </span>
            )}
          </div>

          {/* Comment input */}
          <div className="feedback-form-group">
            <label className="group-label">Nội dung chi tiết</label>
            <textarea
              className="feedback-textarea"
              placeholder="Hãy chia sẻ trải nghiệm nấu nướng, báo cáo lỗi hoặc đề xuất tính năng mới tại đây nhé..."
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <div className="feedback-actions">
            <button
              type="submit"
              className="btn-feedback-submit"
              disabled={loading || rating === 0 || !comment.trim()}
            >
              {loading ? (
                "Đang gửi phản hồi..."
              ) : (
                <>
                  <span>Gửi phản hồi để tiếp tục</span>
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
