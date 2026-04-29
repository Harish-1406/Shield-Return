import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, Search, Network, BarChart3, Settings } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const isAnalyzerActive = location.pathname.startsWith('/analyzer');
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <ShieldCheck className="logo-icon" size={28} />
        <span className="logo-text">ShieldReturn</span>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`} end>
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/returns" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Search size={20} />
          <span>All Returns</span>
        </NavLink>
        {isAnalyzerActive && (
          <NavLink to={location.pathname} className="nav-item active">
            <Search size={20} />
            <span>Return Analyzer</span>
          </NavLink>
        )}
        <NavLink to="/rings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Network size={20} />
          <span>Fraud Ring Intel</span>
          <span className="live-badge">LIVE</span>
        </NavLink>
        <NavLink to="/analytics" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Analytics</span>
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
