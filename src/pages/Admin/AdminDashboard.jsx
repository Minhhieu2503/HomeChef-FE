import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import {
  Users, Utensils, Calendar, ShieldCheck, Sparkles
} from "lucide-react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRecipes: 0,
    newRecipesToday: 0,
    systemUptime: "99.9%",
    newUsersGrowth: 0,
    revenue: "0 VND"
  });

  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [topRecipes, setTopRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/admin/stats");
      if (response.success) {
        const d = response.data;
        
        // Format revenue to VND safely
        const rawRevenue = Number(d.revenue) || 0;
        const formattedRevenue = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(rawRevenue);

        setStats({
          totalUsers: d.totalUsers,
          activeRecipes: d.activeRecipes,
          newRecipesToday: d.pendingRecipes,
          systemUptime: d.systemUptime,
          newUsersGrowth: d.newUsersGrowth,
          revenue: formattedRevenue
        });

        // Mock chart data based on real total for visual consistency
        const base = d.totalUsers * 10;
        setChartData([
          { name: '01/05', value: Math.max(100, base - 200) },
          { name: '10/05', value: Math.max(150, base - 100) },
          { name: '20/05', value: Math.max(200, base - 50) },
          { name: '30/05', value: Math.max(300, base) },
        ]);

        // Use real recent activity from API
        setRecentActivity(d.recentActivity.map(act => ({
          id: act.id,
          chef: act.author,
          action: `Đã đăng món "${act.title}"`,
          time: act.time
        })));

        // Use real top recipes from API
        setTopRecipes(d.topRecipes.map(recipe => ({
          id: recipe.id,
          name: recipe.name,
          views: recipe.views >= 1000 ? (recipe.views / 1000).toFixed(1) + 'k' : recipe.views,
          trend: recipe.growth
        })));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Tạo mảng statsCards để render grid bên dưới
  const statsCards = [
    { label: "Người dùng mới", value: stats.totalUsers, change: `+${stats.newUsersGrowth}%`, icon: <Users size={20} />, color: "user" },
    { label: "Doanh thu", value: stats.revenue, change: "Ổn định", icon: <Sparkles size={20} />, color: "system" },
    { label: "Công thức", value: stats.activeRecipes, change: "Live", icon: <Utensils size={20} />, color: "recipe" },
  ];

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Đang tải dữ liệu thực...</div>;

  return (
    <div className="admin-dashboard-pro">
      <div className="admin-main-view">
        <header className="dashboard-header">
          <h1>Tổng quan hệ thống</h1>
          <p>Báo cáo hoạt động và thống kê thời gian thực</p>
        </header>

        {/* STATS ROW TOP */}
        <div className="stats-row-pro">
          <div className="stat-card-pro">
            <div className="icon-box user"><Users size={20} /></div>
            <div className="stat-info">
              <span className="label">Tổng người dùng</span>
              <div className="value-row">
                <span className="value">{stats.totalUsers}</span>
                <span className="badge positive">+{stats.newUsersGrowth}%</span>
              </div>
            </div>
          </div>

          <div className="stat-card-pro">
            <div className="icon-box recipe"><Utensils size={20} /></div>
            <div className="stat-info">
              <span className="label">Công thức hoạt động</span>
              <div className="value-row">
                <span className="value">{stats.activeRecipes}</span>
              </div>
            </div>
          </div>

          <div className="stat-card-pro">
            <div className="icon-box today"><Calendar size={20} /></div>
            <div className="stat-info">
              <span className="label">Chờ duyệt</span>
              <div className="value-row">
                <span className="value">{stats.newRecipesToday}</span>
              </div>
            </div>
          </div>

          <div className="stat-card-pro">
            <div className="icon-box system"><ShieldCheck size={20} /></div>
            <div className="stat-info">
              <span className="label">Trạng thái</span>
              <div className="value-row">
                <span className="value">{stats.systemUptime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* STATS GRID SECONDARY */}
        <div className="stats-grid-pro">
          {statsCards.map((card, idx) => (
            <div className={`stat-card-pro ${card.color}`} key={idx}>
              <div className="card-top">
                <span className="icon-box">{card.icon}</span>
                <span className="trend-badge">{card.change}</span>
              </div>
              <div className="card-bottom">
                <h3>{card.value}</h3>
                <p>{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-charts-row">
          <div className="chart-main-pro card">
            <div className="card-header">
              <h3>Phân tích hệ thống (30 ngày)</h3>
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Tương tác & Truy cập</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorPv)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-header">
            <h3>Recent Activity</h3>
          </div>
          <table className="activity-table">
            <thead>
              <tr>
                <th>Chef / Admin</th>
                <th>Hành động</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map(act => (
                <tr key={act.id}>
                  <td><b>{act.chef}</b></td>
                  <td>{act.action}</td>
                  <td className="time">{act.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="admin-right-sidebar">
        <div className="sidebar-section">
          <h4 className="section-title">Top Recipes (Live)</h4>
          <div className="top-recipes-list">
            {topRecipes.map(recipe => (
              <div className="recipe-rank-item" key={recipe.id}>
                <div className="rank-info">
                  <span className="recipe-name">{recipe.name}</span>
                  <span className="recipe-stats">{recipe.views} views</span>
                </div>
                <span className={`trend-badge up`}>{recipe.trend}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="insights-widget-pro">
          <div className="widget-header">
            <Sparkles size={20} className="sparkle-icon" />
            <h4>Chef Insights</h4>
          </div>
          <p>
            Hệ thống ghi nhận có <b>{stats.newRecipesToday} công thức mới</b> cần kiểm duyệt. Hãy kiểm tra mục 'Recipes' ngay.
          </p>
          <button className="btn-insight">Xem chi tiết</button>
        </div>
      </aside>
    </div>
  );
};

export default AdminDashboard;