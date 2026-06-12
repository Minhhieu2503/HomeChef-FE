import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { User, Shield, Lock, Unlock, Trash2, Mail, ChevronLeft, ChevronRight } from "lucide-react";
import "./AdminLayout.css";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const fetchUsers = async (pageNum) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users?page=${pageNum}&limit=10`);
      if (response.success) {
        setUsers(response.data);
        setTotalPages(response.pagination.pages || 1);
        setTotalUsers(response.pagination.total || 0);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "locked" : "active";
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      if (response.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      alert("Lỗi cập nhật trạng thái");
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const roleText = newRole === "admin" ? "Quản trị viên" : "Đầu bếp";
    if (!window.confirm(`Bạn có chắc muốn đổi vai trò của người dùng này thành ${roleText}?`)) return;
    
    try {
      const response = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (response.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      }
    } catch (err) {
      alert("Lỗi cập nhật vai trò: " + (err.response?.data?.message || err.message));
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Xóa người dùng này?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      if (users.length === 1 && page > 1) {
        setPage(prev => prev - 1);
      } else {
        fetchUsers(page);
      }
    } catch (err) {
      alert("Lỗi khi xóa");
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Đang kết nối Database...</div>;

  return (
    <div className="view-container-pro">
      <header className="view-header">
        <h1>Quản lý người dùng</h1>
        <p>Phân quyền, kiểm soát bảo mật và trạng thái tài khoản hệ thống (Dữ liệu thực)</p>
      </header>

      <div className="table-container">
        <table className="admin-table-pro">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Ngày tham gia</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="avatar">
                        {user.name ? user.name.charAt(0) : "U"}
                      </div>
                      <div className="name-box">
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{user.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {user._id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td>
                    <span className={`badge-pill ${user.role}`}>
                      {user.role === 'admin' ? 'Quản trị viên' : 'Đầu bếp'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-pill ${user.status || 'active'}`}>
                      {(user.status || 'active') === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button 
                        className="btn-icon-sm" 
                        onClick={() => toggleRole(user._id, user.role)}
                        title={user.role === 'admin' ? 'Hạ cấp xuống Đầu bếp' : 'Nâng cấp lên Quản trị viên'}
                        style={{ color: user.role === 'admin' ? '#ef4444' : '#10b981' }}
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                        className="btn-icon-sm" 
                        onClick={() => toggleStatus(user._id, user.status || 'active')}
                        title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                      >
                        {user.status === 'locked' ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      <button 
                        className="btn-icon-sm danger" 
                        onClick={() => deleteUser(user._id)}
                        title="Xóa người dùng"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Không có dữ liệu người dùng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 1rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Hiển thị trang <b>{page}</b> / <b>{totalPages}</b> (Tổng <b>{totalUsers}</b> người dùng)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: page === 1 ? '#f1f5f9' : 'white',
                color: page === 1 ? '#cbd5e1' : '#475569',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ChevronLeft size={16} /> Trước
            </button>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: page === totalPages ? '#f1f5f9' : 'white',
                color: page === totalPages ? '#cbd5e1' : '#475569',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Sau <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
