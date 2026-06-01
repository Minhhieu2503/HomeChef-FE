import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";
import { authUtils } from "../../utils/authUtils";
import {
  User, Shield, Mail, CreditCard, Flame, UtensilsCrossed,
  Settings, ChevronRight, Edit3, Target, PieChart, Info, X,
  Camera, Upload, Users
} from "lucide-react";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState(""); // "profile", "calories", "preferences", "allergies"
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getMe();
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (error) {
        console.error("Lỗi khi tải profile:", error);
        if (error.response?.status === 401) {
          authUtils.removeToken();
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdateUser = async (updateData) => {
    try {
      setIsSaving(true);
      const res = await authService.updateProfile(updateData);
      if (res.success) {
        setUser(res.data);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setIsSaving(true);
      const res = await authService.uploadAvatar(formData);
      if (res.success) {
        setUser(prev => ({ ...prev, avatar: res.data.avatar }));
      }
    } catch (err) {
      console.error("Lỗi upload avatar:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = async (pref) => {
    const current = user.dietaryPreferences || [];
    const updated = current.includes(pref) 
      ? current.filter(p => p !== pref) 
      : [...current, pref];
    await handleUpdateUser({ dietaryPreferences: updated });
  };

  const toggleAllergy = async (allergy) => {
    const current = user.allergies || [];
    const updated = current.includes(allergy) 
      ? current.filter(a => a !== allergy) 
      : [...current, allergy];
    await handleUpdateUser({ allergies: updated });
  };

  const handleAddCustomTag = async (type) => {
    if (!editValue.trim()) return;
    const current = type === "preferences" ? (user.dietaryPreferences || []) : (user.allergies || []);
    if (current.includes(editValue.trim())) {
      toast.info("Đã tồn tại nhãn này!");
      return;
    }
    const updated = [...current, editValue.trim()];
    await handleUpdateUser({ [type === "preferences" ? "dietaryPreferences" : "allergies"]: updated });
    setEditValue("");
  };

  const handleLogout = () => {
    authUtils.removeToken();
    navigate("/login");
  };

  if (loading) return <div className="p-10 text-center">Đang tải profile...</div>;

  return (
    <div className="profile-page">
      {/* 1. Profile Main Card */}
      <section className="profile-main-card">
        <div className="avatar-large-wrapper">
          <img
            src={user?.avatar || "https://ui-avatars.com/api/?name=Alex&background=4ADE80&color=fff"}
            alt="Profile"
            className="avatar-large"
          />
          <label className="avatar-upload-overlay">
            <Camera size={24} />
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange} 
              style={{ display: 'none' }}
            />
          </label>
          <span className="pro-badge">Pro Member</span>
        </div>

        <div className="profile-info-header">
          <h1>{user?.name || "Người dùng"}</h1>
          <div className="profile-stats">
            <div className="stat-box">
              <span className="value flex items-center gap-2"><Flame size={20} className="text-orange-500" /> {user?.streakDays || 0}</span>
              <span className="label">Streak (Ngày)</span>
            </div>
            <div className="stat-box">
              <span className="value flex items-center gap-2"><UtensilsCrossed size={20} className="text-green-500" /> {user?.completedMealsCount || 0}</span>
              <span className="label">Đã hoàn thành</span>
            </div>
          </div>
        </div>

        <button 
          className="btn-edit-profile" 
          onClick={() => {
            setEditType("profile");
            setEditValue(user?.name || "");
            setIsEditModalOpen(true);
          }}
        >
          <Edit3 size={18} /> Chỉnh sửa
        </button>
      </section>

      {/* 2. Content Grid */}
      <div className="profile-grid">
        <div className="main-content-flow">
          {/* Nutrition Goals Widget */}
          <section className="nutrition-goals-widget">
            <div className="calorie-summary-card">
              <div className="info">
                <h4>Mục tiêu calo hằng ngày</h4>
                <div className="value">{user?.calorieGoal || 2000} kcal</div>
              </div>
              <button 
                className="btn-edit-profile bg-white/20 text-white hover:bg-white/30" 
                onClick={() => {
                  setEditType("calories");
                  setEditValue(user?.calorieGoal || 2000);
                  setIsEditModalOpen(true);
                }}
              >
                Cập nhật
              </button>
            </div>

            <div className="macro-grid">
              {[
                { name: "Protein (Đạm)", key: "protein", color: "#3B82F6", percent: 30, cal: 4 },
                { name: "Fat (Béo)", key: "fat", color: "#F59E0B", percent: 25, cal: 9 },
                { name: "Carbs (Tinh bột)", key: "carbs", color: "#10B981", percent: 45, cal: 4 }
              ].map(macro => (
                <div key={macro.key} className="macro-card">
                  <div className="macro-card-header">
                    <span className="name">{macro.name}</span>
                    <span className="percent" style={{ backgroundColor: `${macro.color}20`, color: macro.color }}>{macro.percent}%</span>
                  </div>
                  <div className="value">
                    {Math.round(((user?.calorieGoal || 2000) * (macro.percent / 100)) / macro.cal)}g
                  </div>
                  <div className="mini-progress">
                    <div className="mini-fill" style={{ width: `${macro.percent}%`, backgroundColor: macro.color }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Preferences & Allergies combined row */}
          <section className="preferences-section">
            <div className="pref-group">
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={20} className="text-primary" />
                <h4 className="m-0">Chế độ ăn ưu tiên</h4>
              </div>
              <div className="tag-cloud">
                {(user?.dietaryPreferences || []).map(tag => (
                  <span 
                    key={tag} 
                    className="pref-tag active flex items-center gap-2"
                  >
                    {tag}
                    <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => togglePreference(tag)} />
                  </span>
                ))}
                <button 
                  className="pref-tag border-dashed" 
                  onClick={() => {
                    setEditType("preferences");
                    setEditValue("");
                    setIsEditModalOpen(true);
                  }}
                >
                  + Thêm mới
                </button>
              </div>
            </div>

            <div className="pref-group">
              <div className="flex items-center gap-2 mb-4">
                <Info size={20} className="text-red-500" />
                <h4 className="m-0">Dị ứng & Kiêng kỵ</h4>
              </div>
              <div className="tag-cloud">
                {(user?.allergies || []).map(tag => (
                  <span 
                    key={tag} 
                    className="pref-tag active flex items-center gap-2"
                  >
                    {tag}
                    <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => toggleAllergy(tag)} />
                  </span>
                ))}
                <button 
                  className="pref-tag border-dashed" 
                  onClick={() => {
                    setEditType("allergies");
                    setEditValue("");
                    setIsEditModalOpen(true);
                  }}
                >
                  + Thêm mới
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* 3. Account Settings Sidebar */}
        <aside className="account-settings-sidebar">
          <div className="settings-list">
            <div className="setting-item" onClick={() => alert('Chế độ bảo mật')}>
              <div className="setting-icon"><Shield size={20} /></div>
              <div className="setting-text">
                <span className="title">Bảo mật</span>
                <span className="subtitle">Mật khẩu, 2FA, Thiết bị</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
            <div className="setting-item" onClick={() => alert('Cài đặt Email')}>
              <div className="setting-icon"><Mail size={20} /></div>
              <div className="setting-text">
                <span className="title">Email & Thông báo</span>
                <span className="subtitle">Cập nhật tin tức, Nhắc nhở</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
            <div className="setting-item" onClick={() => navigate('/profile/family')}>
              <div className="setting-icon"><Users size={20} /></div>
              <div className="setting-text">
                <span className="title">Gia đình & Chia sẻ</span>
                <span className="subtitle">Quản lý thành viên, thực đơn chung</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
            <div className="setting-item" onClick={() => alert('Quản lý thanh toán')}>
              <div className="setting-icon"><CreditCard size={20} /></div>
              <div className="setting-text">
                <span className="title">Thanh toán & Gói cước</span>
                <span className="subtitle">{user?.plan === 'family' ? 'Gói Family' : user?.plan === 'premium' ? 'Gói Premium' : 'Gói Miễn phí'}</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
            <div className="setting-item" onClick={handleLogout}>
              <div className="setting-icon text-red-500"><Settings size={20} /></div>
              <div className="setting-text">
                <span className="title text-red-500">Đăng xuất</span>
                <span className="subtitle">Rời khỏi phiên làm việc</span>
              </div>
              <ChevronRight size={18} className="text-muted" />
            </div>
          </div>
        </aside>
      </div>

      {/* 4. Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content animate-popIn" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editType === "profile" ? "Chỉnh sửa hồ sơ" : 
                 editType === "calories" ? "Cập nhật mục tiêu calo" : 
                 editType === "preferences" ? "Thêm sở thích ăn uống" : "Thêm dị ứng"}
              </h3>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="modal-body p-6">
              {editType === "profile" && (
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input 
                    type="text" 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    placeholder="Nhập tên của bạn"
                  />
                </div>
              )}
              {editType === "calories" && (
                <div className="form-group">
                  <label>Lượng calo mục tiêu (kcal/ngày)</label>
                  <input 
                    type="number" 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    placeholder="Ví dụ: 2000"
                  />
                </div>
              )}
              {(editType === "preferences" || editType === "allergies") && (
                <div className="form-group">
                  <label>{editType === "preferences" ? "Tên sở thích" : "Tên dị ứng"}</label>
                  <input 
                    type="text" 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    placeholder="Ví dụ: Không ăn hành, Dị ứng tôm..."
                    autoFocus
                  />
                </div>
              )}
              <button 
                className={`btn-save-ingredient w-full mt-4 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`} 
                disabled={isSaving}
                onClick={() => {
                  if (editType === "profile") handleUpdateUser({ name: editValue });
                  if (editType === "calories") handleUpdateUser({ calorieGoal: Number(editValue) });
                  if (editType === "preferences" || editType === "allergies") handleAddCustomTag(editType);
                }}
              >
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
