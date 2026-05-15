import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { useToast } from "../../context/ToastContext";
import { Mail, Lock, ChefHat, ArrowLeft, Key, ShieldCheck } from "lucide-react";
import "./ForgotPassword.css";

function ForgotPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        toast.success("Mã xác nhận đã được gửi về Email của bạn!");
        setStep(2);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể gửi mã. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.resetPassword({ email, code: otp, newPassword });
      if (response.success) {
        toast.success("Mật khẩu đã được cập nhật thành công!");
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Mã xác nhận không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* LEFT SIDE: Visual Content */}
      <div className="login-visual-section">
        <div className="visual-overlay"></div>
        <div className="branding-content">
          <div className="brand-logo">
            <ChefHat size={40} />
          </div>
          <h1>Bảo Mật<br />Tài Khoản</h1>
          <p>Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại quyền truy cập vào gian bếp của mình.</p>
        </div>
        <img
          src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          alt="Security"
          className="bg-image"
        />
      </div>

      {/* RIGHT SIDE: Form Section */}
      <div className="login-form-section">
        <div className="form-container">
          <header className="form-header">
            <Link to="/login" className="back-link">
              <ArrowLeft size={18} /> Quay lại đăng nhập
            </Link>
            <h2 translate="no">{step === 1 ? "Khôi phục mật khẩu" : "Đổi mật khẩu mới"}</h2>
            <p translate="no">
              {step === 1 
                ? "Nhập email của bạn để nhận mã xác minh khôi phục tài khoản." 
                : "Nhập mã OTP đã được gửi đến email và mật khẩu mới của bạn."}
            </p>
          </header>

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="premium-form">
              <div className="input-field">
                <label>EMAIL CỦA BẠN</label>
                <div className="input-wrapper">
                  <Mail className="field-icon" size={18} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn-login-premium" disabled={loading}>
                {loading ? "Đang gửi mã..." : "GỬI MÃ XÁC NHẬN"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="premium-form">
              <div className="input-field">
                <label>MÃ XÁC NHẬN (OTP)</label>
                <div className="input-wrapper">
                  <Key className="field-icon" size={18} />
                  <input
                    type="text"
                    placeholder="Nhập 6 chữ số"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="input-field">
                <label>MẬT KHẨU MỚI</label>
                <div className="input-wrapper">
                  <Lock className="field-icon" size={18} />
                  <input
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-login-premium" disabled={loading}>
                {loading ? "Đang cập nhật..." : "CẬP NHẬT MẬT KHẨU"}
              </button>

              <button 
                type="button" 
                className="btn-resend" 
                onClick={handleSendCode}
                disabled={loading}
              >
                Gửi lại mã xác nhận
              </button>
            </form>
          )}

          <div className="security-note">
            <ShieldCheck size={16} />
            <span>Kết nối an toàn & bảo mật 256-bit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
