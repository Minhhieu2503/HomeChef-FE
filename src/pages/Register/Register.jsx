import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { authUtils } from "../../utils/authUtils";
import { useToast } from "../../context/ToastContext";
import { User, Mail, Lock, ChefHat, ArrowRight, Eye, EyeOff } from "lucide-react";
import "./Register.css";

function Register() {
  const toast = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.register({ name, email, password });
      if (response.success) {
        authUtils.setToken(response.data.token);
        authUtils.setUser(response.data.user);
        localStorage.setItem("hasSeenOnboarding", "true");
        sessionStorage.setItem("justRegistered", "true");
        toast.success("Chào mừng bạn gia nhập HomeChef!");
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* LEFT SIDE: Visual Content (Same as Login for consistency) */}
      <div className="login-visual-section">
        <div className="visual-overlay"></div>
        <div className="branding-content">
          <div className="brand-logo">
            <ChefHat size={40} />
          </div>
          <h1>Bắt Đầu Hành Trình<br />Ẩm Thực Của Bạn</h1>
          <p>Tham gia cộng đồng HomeChef để khám phá và chia sẻ những món ăn tuyệt vời nhất.</p>
          <div className="feature-badges">
            <span>🍳 Công thức chuẩn</span>
            <span>🌿 Lành mạnh</span>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          alt="Culinary"
          className="bg-image"
        />
      </div>

      {/* RIGHT SIDE: Register Form */}
      <div className="login-form-section">
        <div className="form-container">
          <header className="form-header">
            <h2>Đăng ký thành viên</h2>
            <p>Tạo tài khoản để bắt đầu trải nghiệm đầy đủ các tính năng của HomeChef.</p>
          </header>

          <form onSubmit={handleSubmit} className="premium-form" autoComplete="off">
            <div className="input-field">
              <label>HỌ VÀ TÊN</label>
              <div className="input-wrapper">
                <User className="field-icon" size={18} />
                <input
                  type="text"
                  placeholder="Nhập tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-field">
              <label>EMAIL</label>
              <div className="input-wrapper">
                <Mail className="field-icon" size={18} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="new-email"
                />
              </div>
            </div>

            <div className="input-field">
              <label>MẬT KHẨU</label>
              <div className="input-wrapper">
                <Lock className="field-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login-premium" disabled={loading}>
              {loading ? "Đang tạo tài khoản..." : (
                <>
                  <span>ĐĂNG KÝ NGAY</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="signup-text">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
