import React from "react";
import { Settings, Cpu, BrainCircuit, Activity, Save, Key } from "lucide-react";
import "./AdminLayout.css";

const AdminSystem = () => {
  return (
    <div className="view-container-pro">
      <header className="view-header">
        <h1>Hệ thống Thông minh & Dinh dưỡng</h1>
        <p>Quản lý kết nối API AI (Vision, Gemini) và định mức dinh dưỡng hệ thống.</p>
      </header>

      <div className="system-grid-pro" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        {/* API CONFIG */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <Cpu className="text-emerald" size={24} style={{ color: '#10b981' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Cấu hình API AI</h3>
          </div>
          
          <div className="api-status-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { name: "Google Vision API", status: "Connected", latency: "240ms", icon: <Settings size={16} /> },
              { name: "Gemini AI Advisor", status: "Active", latency: "1.2s", icon: <BrainCircuit size={16} /> },
              { name: "Nutrition Engine", status: "Active", latency: "45ms", icon: <Activity size={16} /> }
            ].map(api => (
              <div key={api.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ color: '#64748b' }}>{api.icon}</div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{api.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge-pill active" style={{ fontSize: '0.65rem' }}>{api.status}</span>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem' }}>{api.latency}</div>
                </div>
              </div>
            ))}
          </div>
          
          <button style={{ 
            marginTop: '1.5rem', width: '100%', padding: '0.85rem', background: '#0f172a', 
            color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' 
          }}>
            <Key size={18} />
            Cập nhật API Keys
          </button>
        </div>

        {/* NUTRITION CONFIG */}
        <div className="admin-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <Activity className="text-blue" size={24} style={{ color: '#3b82f6' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Định mức Dinh dưỡng (Macros)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { label: "Calories base (per 100g)", val: "250", unit: "kcal" },
              { label: "Protein factor", val: "4.0", unit: "kcal/g" },
              { label: "Fat factor", val: "9.0", unit: "kcal/g" }
            ].map(row => (
              <div key={row.label}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{row.label}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    defaultValue={row.val} 
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700 }} 
                  />
                  <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#94a3b8' }}>{row.unit}</span>
                </div>
              </div>
            ))}
            
            <button style={{ 
              marginTop: '0.5rem', width: '100%', padding: '0.85rem', background: '#10b981', 
              color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer'
            }}>
              <Save size={18} />
              Lưu cấu hình hệ thống
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSystem;
