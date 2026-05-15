import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { authService } from "../../services/auth.service";
import { authUtils } from "../../utils/authUtils";
import { useToast } from "../../context/ToastContext";
import { LogIn, Mail, Lock, ChefHat, ArrowRight, Eye, EyeOff } from "lucide-react";
import "./Login.css";

function Login() {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Trạng thái ẩn hiện mật khẩu
  const [loading, setLoading] = useState(false);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    const checkPlatform = () => {
      const native = Capacitor.isNativePlatform();
      setIsNative(native);
      if (native) {
        GoogleAuth.initialize();
      }
    };
    checkPlatform();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      if (response.success) {
        authUtils.setToken(response.data.token);
        authUtils.setUser(response.data.user);
        localStorage.setItem("hasSeenOnboarding", "true");
        toast.success("Mừng bạn trở lại!");

        if (response.data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleWebSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await authService.googleLogin(credentialResponse.credential);
      if (response.success) {
        authUtils.setToken(response.data.token);
        authUtils.setUser(response.data.user);
        localStorage.setItem("hasSeenOnboarding", "true");
        toast.success("Đăng nhập Google thành công!");

        if (response.data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      toast.error("Xác thực Google thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleNativeGoogleLogin = async () => {
    setLoading(true);
    try {
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;
      if (!idToken) throw new Error("No ID Token received");

      const response = await authService.googleLogin(idToken);
      if (response.success) {
        authUtils.setToken(response.data.token);
        authUtils.setUser(response.data.user);
        localStorage.setItem("hasSeenOnboarding", "true");
        toast.success("Đăng nhập APK thành công!");
        if (response.data.user.role === "admin") navigate("/admin");
        else navigate("/");
      }
    } catch (err) {
      toast.error("Lỗi đăng nhập Google trên thiết bị.");
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
          <h1>Nấu Ăn Ngon<br />Tại Nhà</h1>
          <p>Khám phá hàng ngàn công thức nấu ăn độc đáo dành riêng cho bạn.</p>
          <div className="feature-badges">
            <span>✨ Gợi ý AI</span>
            <span>🔥 Xu hướng</span>
          </div>
        </div>
        <img
          src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
          alt="Culinary"
          className="bg-image"
        />
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="login-form-section">
        <div className="form-container">
          <header className="form-header">
            <h2>Chào mừng bạn!</h2>
            <p>Đăng nhập để lưu lại các món ngon và kế hoạch nấu nướng của riêng bạn.</p>
          </header>

          <form onSubmit={handleSubmit} className="premium-form" autoComplete="off">
            <div className="input-field">
              <label>EMAIL</label>
              <div className="input-wrapper">
                <Mail className="field-icon" size={18} />
                <input
                  type="email"
                  placeholder=""
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="forgot-pw-container">
                <Link to="/forgot" className="forgot-pw" translate="no">Lấy lại mật khẩu?</Link>
              </div>
            </div>

            <button type="submit" className="btn-login-premium" disabled={loading}>
              {loading ? "Đang xử lý..." : (
                <>
                  <span>BẮT ĐẦU NẤU ĂN</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="divider">
            <span>HOẶC TIẾP TỤC VỚI</span>
          </div>

          <div className="social-login">
            {isNative ? (
              <button className="btn-google-native" onClick={handleNativeGoogleLogin} disabled={loading}>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" />
                Đăng nhập bằng Google
              </button>
            ) : (
              <GoogleLogin
                onSuccess={onGoogleWebSuccess}
                onError={() => toast.error("Đăng nhập Google thất bại")}
                theme="filled_blue"
                size="large"
                shape="rectangular"
                width="100%"
                locale="vi"
              />
            )}
          </div>

          <p className="signup-text">
            Mới tham gia? <Link to="/register">Đăng ký thành viên</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
