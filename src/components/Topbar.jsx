import React, { useState, useEffect } from 'react';
import { Bell, User } from 'lucide-react';
import './Topbar.css';

const Topbar = () => {
  const [returnCount, setReturnCount] = useState(3847);

  useEffect(() => {
    // Simulate live monitoring
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setReturnCount(prev => prev + 1);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* Breadcrumb or title can go here if needed */}
      </div>
      
      <div className="topbar-right">
        <div className="live-counter">
          <span className="pulse-dot-green"></span>
          Monitoring <span className="mono">{returnCount.toLocaleString()}</span> returns
        </div>
        
        <div className="topbar-icon-btn">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </div>
        
        <div className="user-avatar">
          <User size={18} />
        </div>
      </div>
    </div>
  );
};

export default Topbar;
