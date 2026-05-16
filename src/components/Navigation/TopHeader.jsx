import { useState, useEffect } from "react";
import { authService } from "../../services/auth.service";
import { getDashboardOverview } from "../../services/dashboardService";
import "./Navigation.css";

function TopHeader() {
  const [user, setUser] = useState(null);
  const [goalPercent, setGoalPercent] = useState(85); // Default as per prompt

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const me = await authService.getMe();
        if (me.success) setUser(me.data);

        const overview = await getDashboardOverview();
        if (overview.success && overview.data.nutrition) {
          const { calories } = overview.data.nutrition;
          const percent = Math.round((calories.current / calories.goal) * 100);
          setGoalPercent(Math.min(percent, 100));
        }
      } catch (err) {
        console.error("Header data fetch error:", err);
      }
    };
    fetchUserData();
  }, []);

  return (
    <header className="mobile-top-header">
      <div className="header-user-group">
        <img 
          src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=4ADE80&color=fff"} 
          alt="Avatar" 
          className="header-avatar"
        />
        <div className="header-stats">
          <span className="goal-text">Mục tiêu: {goalPercent}%</span>
          <div className="goal-progress-mini">
            <div className="goal-fill" style={{ width: `${goalPercent}%` }}></div>
          </div>
        </div>
      </div>
      <div className="header-logo-compact">
        <span>🍳 HomeChef</span>
      </div>
    </header>
  );
}

export default TopHeader;
