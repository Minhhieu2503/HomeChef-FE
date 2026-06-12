import React, { useState, useEffect } from "react";
import { feedbackService } from "../../services/feedback.service";
import { useToast } from "../../context/ToastContext";
import { 
  Star, MessageSquare, AlertTriangle, Lightbulb, 
  HelpCircle, CheckCircle, Clock, Filter, User, Calendar 
} from "lucide-react";
import "./AdminFeedback.css";

const AdminFeedback = () => {
  const toast = useToast();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    averageRating: 0,
    pending: 0,
    resolved: 0
  });

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (ratingFilter) params.rating = ratingFilter;
      if (sortBy) params.sort = sortBy;

      const res = await feedbackService.getFeedbacks(params);
      if (res.success && res.data) {
        setFeedbacks(res.data);
        
        // Calculate local statistics based on the full fetched list
        const list = res.data;
        const total = list.length;
        const sum = list.reduce((acc, f) => acc + f.rating, 0);
        const avg = total > 0 ? (sum / total).toFixed(1) : 0;
        const pending = list.filter(f => f.status === "pending").length;
        const resolved = list.filter(f => f.status === "resolved").length;

        setStats({ total, averageRating: avg, pending, resolved });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Tải danh sách góp ý thất bại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [typeFilter, statusFilter, ratingFilter, sortBy]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await feedbackService.updateFeedbackStatus(id, newStatus);
      if (res.success) {
        toast.success(res.message || "Cập nhật trạng thái thành công!");
        // Update item in state
        setFeedbacks(prev => 
          prev.map(f => f._id === id ? { ...f, status: newStatus } : f)
        );
        // Recalculate stats
        setStats(prev => {
          const updatedList = feedbacks.map(f => f._id === id ? { ...f, status: newStatus } : f);
          const pending = updatedList.filter(f => f.status === "pending").length;
          const resolved = updatedList.filter(f => f.status === "resolved").length;
          return { ...prev, pending, resolved };
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Cập nhật trạng thái thất bại.");
    }
  };

  const getFeedbackTypeDetails = (type) => {
    switch (type) {
      case "bug":
        return { label: "Báo lỗi", class: "badge-bug", icon: <AlertTriangle size={14} /> };
      case "feature":
        return { label: "Tính năng", class: "badge-feature", icon: <Lightbulb size={14} /> };
      case "other":
        return { label: "Khác", class: "badge-other", icon: <HelpCircle size={14} /> };
      default:
        return { label: "Góp ý", class: "badge-general", icon: <MessageSquare size={14} /> };
    }
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case "resolved":
        return { label: "Đã giải quyết", class: "status-resolved", icon: <CheckCircle size={14} /> };
      case "reviewed":
        return { label: "Đã xem", class: "status-reviewed", icon: <Clock size={14} /> };
      default:
        return { label: "Đang chờ", class: "status-pending", icon: <Clock size={14} /> };
    }
  };

  const renderStars = (count) => {
    return (
      <div className="admin-stars-display">
        {[1, 2, 3, 4, 5].map(s => (
          <Star 
            key={s} 
            size={14} 
            fill={s <= count ? "#F59E0B" : "none"} 
            color={s <= count ? "#F59E0B" : "#cbd5e1"} 
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="admin-feedback-view animate-fadeIn">
      {/* 1. Summary Cards */}
      <div className="stats-row-pro">
        <div className="stat-card-pro">
          <div className="icon-box user">
            <MessageSquare size={24} />
          </div>
          <div className="stat-info">
            <span className="label">Tổng số góp ý</span>
            <div className="value-row">
              <span className="value">{stats.total}</span>
            </div>
          </div>
        </div>

        <div className="stat-card-pro">
          <div className="icon-box system">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="label">Chưa xử lý</span>
            <div className="value-row">
              <span className="value text-warning">{stats.pending}</span>
            </div>
          </div>
        </div>

        <div className="stat-card-pro">
          <div className="icon-box today">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="label">Đã giải quyết</span>
            <div className="value-row">
              <span className="value text-success">{stats.resolved}</span>
            </div>
          </div>
        </div>

        <div className="stat-card-pro">
          <div className="icon-box recipe">
            <Star size={24} />
          </div>
          <div className="stat-info">
            <span className="label">Đánh giá trung bình</span>
            <div className="value-row">
              <span className="value">{stats.averageRating} ⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="feedback-filter-bar">
        <div className="filter-title">
          <Filter size={18} />
          <span>Bộ lọc ý kiến</span>
        </div>
        <div className="filter-options">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Tất cả phân loại</option>
            <option value="general">Góp ý chung</option>
            <option value="bug">Báo lỗi</option>
            <option value="feature">Tính năng mới</option>
            <option value="other">Khác</option>
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="reviewed">Đã xem</option>
            <option value="resolved">Đã giải quyết</option>
          </select>

          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}>
            <option value="">Tất cả đánh giá</option>
            <option value="5">5 Sao (Tuyệt nhất)</option>
            <option value="4">4 Sao</option>
            <option value="3">3 Sao</option>
            <option value="2">2 Sao</option>
            <option value="1">1 Sao (Tệ nhất)</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
          </select>
        </div>
      </div>

      {/* 3. Feedback Cards Grid */}
      {loading ? (
        <div className="admin-feedback-loading">
          <div className="spinner-border text-primary animate-spin" role="status">
            <span className="sr-only">👨‍🍳 Đang tải góp ý...</span>
          </div>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="admin-feedback-empty">
          <MessageSquare size={48} className="text-muted" />
          <h3>Không tìm thấy góp ý nào!</h3>
          <p>Hiện tại chưa có góp ý nào từ khách hàng phù hợp với bộ lọc đã chọn.</p>
        </div>
      ) : (
        <div className="feedback-cards-grid">
          {feedbacks.map((item) => {
            const typeInfo = getFeedbackTypeDetails(item.type);
            const statusInfo = getStatusDetails(item.status);

            return (
              <div key={item._id} className={`feedback-card-pro ${item.status}`}>
                <div className="card-top-section">
                  <div className="user-profile-section">
                    <img 
                      src={item.user?.avatar || "https://ui-avatars.com/api/?name=User&background=cbd5e1&color=fff"} 
                      alt="User Avatar"
                      className="user-small-avatar" 
                    />
                    <div className="user-text-details">
                      <span className="name">{item.user?.name || "Người dùng ẩn danh"}</span>
                      <span className="email">{item.user?.email || "Chưa cập nhật email"}</span>
                    </div>
                  </div>

                  <span className={`type-tag ${typeInfo.class}`}>
                    {typeInfo.icon}
                    {typeInfo.label}
                  </span>
                </div>

                <div className="card-middle-section">
                  <div className="stars-and-time">
                    {renderStars(item.rating)}
                    <span className="time-badge">
                      <Calendar size={12} />
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="comment-text">"{item.comment}"</p>
                </div>

                <div className="card-bottom-section">
                  <div className="status-badge-container">
                    <span className={`status-indicator ${statusInfo.class}`}>
                      {statusInfo.icon}
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="status-action-container">
                    <label>Trạng thái:</label>
                    <select 
                      value={item.status} 
                      onChange={(e) => handleStatusChange(item._id, e.target.value)}
                    >
                      <option value="pending">Đang chờ</option>
                      <option value="reviewed">Đã xem</option>
                      <option value="resolved">Đã giải quyết</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
