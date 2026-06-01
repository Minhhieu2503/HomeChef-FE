import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import api from "../../services/api";
import { authService } from "../../services/auth.service";
import { Users, UserPlus, Trash2, PieChart, Crown } from "lucide-react";
import "./Family.css";

function FamilyManagement() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const meRes = await authService.getMe();
      if (meRes.success) setUser(meRes.data);

      const familyRes = await api.get("/family/me");
      setFamily(familyRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateFamily = async () => {
    try {
      await api.post("/family/create", { name: `Gia đình của ${user?.name}` });
      toast.success("Đã tạo nhóm gia đình thành công");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi tạo gia đình");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      await api.post("/family/invite", { email: inviteEmail });
      toast.success(`Đã thêm ${inviteEmail} vào gia đình`);
      setInviteEmail("");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi mời thành viên");
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm("Xóa thành viên này khỏi gia đình?")) return;
    try {
      await api.delete(`/family/member/${memberId}`);
      toast.success("Đã xóa thành viên");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi xóa thành viên");
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải thông tin gia đình...</div>;

  if (user?.plan !== "family") {
    return (
      <div className="family-page text-center p-10">
        <Users size={64} className="mx-auto text-gray-300 mb-4" />
        <h2>Tính năng Gia đình</h2>
        <p className="text-gray-500 mb-6">Nâng cấp lên gói Family để chia sẻ giỏ hàng, thực đơn và kết nối tới 5 thành viên.</p>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="family-page text-center p-10">
        <Users size={64} className="mx-auto text-blue-500 mb-4" />
        <h2>Gia đình của bạn</h2>
        <p className="text-gray-500 mb-6">Bạn chưa tạo nhóm gia đình nào. Hãy tạo ngay để bắt đầu chia sẻ!</p>
        <button className="btn btn-primary" onClick={handleCreateFamily}>
          Tạo nhóm Gia đình
        </button>
      </div>
    );
  }

  const isAdmin = family.admin === user?._id;

  return (
    <div className="family-page">
      <header className="family-header mb-8">
        <h1>{family.name}</h1>
        <p className="text-gray-500">Quản lý các thành viên và chia sẻ với người thân.</p>
      </header>

      <div className="family-grid grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="members-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="flex items-center gap-2"><Users size={20} className="text-blue-500" /> Thành viên ({family.members?.length}/{family.maxMembers})</h3>
          </div>

          <ul className="space-y-4">
            {family.members?.map(member => (
              <li key={member._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`} alt={member.name} className="w-10 h-10 rounded-full" />
                  <div>
                    <p className="font-semibold text-gray-800 flex items-center gap-2">
                      {member.name} 
                      {member._id === family.admin && <Crown size={14} className="text-yellow-500" />}
                    </p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                {isAdmin && member._id !== user?._id && (
                  <button className="text-red-500 hover:bg-red-50 p-2 rounded-lg" onClick={() => handleRemove(member._id)}>
                    <Trash2 size={18} />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {isAdmin && family.members?.length < family.maxMembers && (
            <form onSubmit={handleInvite} className="mt-6 flex gap-2">
              <input 
                type="email" 
                placeholder="Nhập email người thân..." 
                className="flex-1 p-2 border rounded-xl outline-none focus:border-blue-500"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                required
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-600 transition">
                <UserPlus size={18} /> Thêm
              </button>
            </form>
          )}
        </div>

        <div className="nutrition-card bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="flex items-center gap-2"><PieChart size={20} className="text-green-500" /> Báo cáo dinh dưỡng (Beta)</h3>
          </div>
          <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-xl text-center p-6 border border-dashed border-gray-200">
            <PieChart size={48} className="text-gray-300 mb-4" />
            <p className="text-gray-500">Tính năng thống kê lượng calo và dinh dưỡng hàng tuần của cả gia đình đang được hoàn thiện.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FamilyManagement;
