import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { User, Activity, Globe, Monitor, Smartphone, ChevronLeft, ChevronRight, RefreshCw, Mail } from "lucide-react";
import "./AdminLayout.css";

const AdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [stats, setStats] = useState({
    uniqueIps: 0,
    activeUsers: 0,
    uniqueGuests: 0,
    guestClicks: 0,
    authClicks: 0,
    totalRegisteredUsers: 0,
    totalLogs: 0
  });

  useEffect(() => {
    fetchLogs(page);
  }, [page]);

  const fetchLogs = async (pageNum) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/logs?page=${pageNum}&limit=50`);
      if (response.success) {
        setLogs(response.data);
        setTotalPages(response.pagination.pages || 1);
        setTotalLogs(response.pagination.total || 0);
        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const parseUserAgent = (ua) => {
    if (!ua) return { name: "Không xác định", icon: <Monitor size={14} /> };
    const lower = ua.toLowerCase();
    
    if (lower.includes("capacitor") || lower.includes("android") && lower.includes("mobile")) {
      return { name: "HomeChef Mobile App", icon: <Smartphone size={14} className="text-green-500" /> };
    }
    if (lower.includes("iphone") || lower.includes("ipad")) {
      return { name: "iOS App/Safari", icon: <Smartphone size={14} className="text-blue-400" /> };
    }
    if (lower.includes("windows")) {
      return { name: "Windows PC", icon: <Monitor size={14} className="text-slate-600" /> };
    }
    if (lower.includes("macintosh")) {
      return { name: "macOS PC", icon: <Monitor size={14} className="text-slate-500" /> };
    }
    if (lower.includes("linux")) {
      return { name: "Linux PC", icon: <Monitor size={14} className="text-orange-500" /> };
    }
    return { name: "Trình duyệt Web", icon: <Globe size={14} className="text-blue-500" /> };
  };

  const formatPath = (path) => {
    if (!path) return "";
    return path.replace("/api", "");
  };

  return (
    <div className="view-container-pro">
      <header className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Nhật ký truy cập hệ thống</h1>
          <p>Theo dõi thời gian thực lưu lượng truy cập, lịch sử thao tác API và thiết bị truy cập</p>
        </div>
        <button 
          onClick={() => fetchLogs(page)} 
          className="btn-icon-sm"
          style={{ padding: '8px 16px', background: '#10b981', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Tải lại dữ liệu"
        >
          <RefreshCw size={14} /> Tải lại
        </button>
      </header>

      {/* Access Stats Grid */}
      <div className="stats-grid-mini" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="stat-card-mini" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TỔNG LƯỢT TRUY CẬP API</span>
            <Activity size={18} className="text-indigo-500" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{totalLogs.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', display: 'flex', gap: '8px' }}>
            <span className="text-indigo-600 font-semibold">{stats.authClicks} click thành viên</span>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span className="text-amber-600 font-semibold">{stats.guestClicks} click khách</span>
          </div>
        </div>

        <div className="stat-card-mini" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>THÀNH VIÊN ĐÃ SỬ DỤNG APP</span>
            <User size={18} className="text-emerald-500" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{stats.activeUsers} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>người dùng</span></div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Tổng số đăng ký hệ thống: <b className="text-slate-800">{stats.totalRegisteredUsers}</b> tài khoản
          </div>
        </div>

        <div className="stat-card-mini" style={{ padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>KHÁCH VÃNG LAI TRUY CẬP (THEO IP)</span>
            <Globe size={18} className="text-amber-500" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>{stats.uniqueGuests} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748b' }}>thiết bị</span></div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Tổng số click / lượt tương tác của khách: <b className="text-amber-600">{stats.guestClicks}</b> lần
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-container">
        <table className="admin-table-pro">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người truy cập</th>
              <th>Phương thức & API</th>
              <th>Địa chỉ IP</th>
              <th>Thiết bị & Nguồn</th>
            </tr>
          </thead>
          <tbody>
            {logs && logs.length > 0 ? (
              logs.map(log => {
                const device = parseUserAgent(log.userAgent);
                return (
                  <tr key={log._id}>
                    <td style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>
                      {new Date(log.timestamp).toLocaleString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </td>
                    <td>
                      {log.user ? (
                        <div className="user-info-cell">
                          <div className="avatar" style={{ background: '#10b981', color: 'white', fontWeight: 'bold' }}>
                            {log.user.name ? log.user.name.charAt(0) : "U"}
                          </div>
                          <div className="name-box">
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.user.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Mail size={10} /> {log.user.email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="user-info-cell" style={{ opacity: 0.65 }}>
                          <div className="avatar" style={{ background: '#cbd5e1', color: '#64748b' }}>
                            K
                          </div>
                          <div className="name-box">
                            <div style={{ fontWeight: 600, color: '#64748b' }}>Khách vãng lai</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Chưa đăng nhập</div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`method-badge ${log.method?.toLowerCase() || 'get'}`} style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          color: 'white',
                          background: log.method === 'POST' ? '#3b82f6' : log.method === 'PUT' ? '#f59e0b' : log.method === 'DELETE' ? '#ef4444' : '#10b981'
                        }}>
                          {log.method}
                        </span>
                        <code style={{ fontSize: '0.8rem', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                          {formatPath(log.path)}
                        </code>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
                      {log.ipAddress || "::1"}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.8rem' }}>
                        {device.icon}
                        <span>{device.name}</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  {loading ? "Đang tải nhật ký..." : "Không có nhật ký truy cập nào."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', padding: '0 1rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Hiển thị trang <b>{page}</b> / <b>{totalPages}</b> (Tổng <b>{totalLogs}</b> bản ghi)
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

export default AdminLogs;
