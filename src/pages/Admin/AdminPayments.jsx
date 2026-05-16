import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { CreditCard, DollarSign, Clock, AlertCircle, CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import "./AdminLayout.css";

const AdminPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    pendingCount: 0,
    refundCount: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await api.get("/admin/payments");
      if (response.success) {
        const data = response.data;
        setTransactions(data);

        // Calculate stats using local timezone strings to ensure UI matches logic
        const todayStr = new Date().toLocaleDateString('vi-VN');
        let todayRev = 0;
        let pending = 0;

        data.forEach(tx => {
          const txDateStr = new Date(tx.createdAt).toLocaleDateString('vi-VN');
          // Support both lowercase and any potential uppercase status 
          const status = (tx.status || "").toLowerCase();
          
          if (status === 'success' && txDateStr === todayStr) {
            todayRev += Number(tx.amount) || 0;
          }
          if (status === 'pending') {
            pending++;
          }
        });

        setStats({
          todayRevenue: todayRev,
          pendingCount: pending,
          refundCount: 0 // Mocked for now
        });
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  if (loading) return <div key="loading" style={{ padding: '3rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> Đang tải giao dịch thực...</div>;
  
  return (
    <div key="content" className="view-container-pro">
      <header className="view-header">
        <h1>Quản lý Giao dịch & Thanh toán</h1>
        <p>Theo dõi dòng tiền, doanh thu qua các cổng thanh toán tích hợp (Dữ liệu thực).</p>
      </header>

      {/* FINANCE STATS */}
      <div className="stats-grid-pro" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Doanh thu hôm nay</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{formatVND(stats.todayRevenue)}</div>
            </div>
            <div style={{ background: '#dcfce7', color: '#10b981', padding: '0.75rem', borderRadius: '12px' }}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Giao dịch đang chờ</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats.pendingCount}</div>
            </div>
            <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px' }}>
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Yêu cầu hoàn tiền</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>{stats.refundCount}</div>
            </div>
            <div style={{ background: '#fee2e2', color: '#ef4444', padding: '0.75rem', borderRadius: '12px' }}>
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="admin-table-pro">
          <thead>
            <tr>
              <th>Mã GD</th>
              <th>Người dùng</th>
              <th>Số tiền</th>
              <th>Cổng</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={tx._id || idx}>
                <td><code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>{tx.orderId}</code></td>
                <td>
                  <div style={{ fontWeight: 600 }}>{tx.user?.name || "N/A"}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tx.user?.email}</div>
                </td>
                <td><div style={{ fontWeight: 800, color: '#0f172a' }}>{formatVND(tx.amount)}</div></td>
                <td>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>VNPAY</span>
                </td>
                <td>
                  <span className={`badge-pill ${tx.status}`}>
                    {tx.status === 'success' ? 'Hoàn tất' : tx.status === 'pending' ? 'Chờ xử lý' : 'Thất bại'}
                  </span>
                </td>
                <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-icon-sm" title="Xem chi tiết"><ExternalLink size={16} /></button>
                    {tx.status === 'success' && <button className="btn-icon-sm danger" title="Hoàn tiền">RE</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayments;
