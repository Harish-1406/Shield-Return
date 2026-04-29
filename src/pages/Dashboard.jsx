import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import GlassCard from '../components/GlassCard';
import RiskBadge from '../components/RiskBadge';
import { AlertCircle, ShieldAlert, ArrowRight, TrendingUp, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import './Dashboard.css';

const fraudData = [
  { name: 'Wardrobing', value: 43 },
  { name: 'INR Abuse', value: 28 },
  { name: 'Damage Claims', value: 19 },
  { name: 'Receipt Fraud', value: 10 },
];
const COLORS = ['#2D7FF9', '#FAAD14', '#FF4D4F', '#52C41A'];

// Animated Number Component
const AnimatedNumber = ({ value, prefix = '', suffix = '', duration = 1500 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

const Dashboard = () => {
  const [returns, setReturns] = useState([]);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "returns"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setReturns(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredReturns = statusFilter ? returns.filter(r => r.status === statusFilter) : returns;
  const counts = {
    total: returns.length,
    auto_approved: returns.filter(r => r.status === 'auto_approved').length,
    under_review: returns.filter(r => r.status === 'under_review').length,
    blocked: returns.filter(r => r.status === 'blocked').length,
  };

  const fraudPreventedValue = returns.filter(r => r.status === 'blocked').reduce((acc, r) => acc + (r.value || 0), 0);
  const activeHighRiskReturn = returns.find(r => r.status === 'under_review');

  const getCardProps = (filterValue) => ({
    className: `kpi-card ${statusFilter === filterValue ? 'active-filter' : ''}`,
    onClick: () => setStatusFilter(statusFilter === filterValue ? null : filterValue)
  });

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Overview</h1>
        <p className="text-secondary">Live fraud intelligence and return metrics</p>
      </header>

      {/* KPI Row */}
      <div className="kpi-grid">
        <GlassCard {...getCardProps(null)}>
          <div className="kpi-label">Total Returns Today</div>
          <div className="kpi-value"><AnimatedNumber value={counts.total} /></div>
        </GlassCard>
        <GlassCard glowColor="var(--success)" {...getCardProps('auto_approved')}>
          <div className="kpi-label">Auto-Approved</div>
          <div className="kpi-value text-success"><AnimatedNumber value={counts.auto_approved} /> <span className="kpi-sub">({Math.round((counts.auto_approved/(counts.total||1))*100)}%)</span></div>
        </GlassCard>
        <GlassCard glowColor="var(--warning)" {...getCardProps('under_review')}>
          <div className="kpi-label">Under Review</div>
          <div className="kpi-value text-warning"><AnimatedNumber value={counts.under_review} /> <span className="kpi-sub">({Math.round((counts.under_review/(counts.total||1))*100)}%)</span></div>
        </GlassCard>
        <GlassCard glowColor="var(--danger)" {...getCardProps('blocked')}>
          <div className="kpi-label">Blocked</div>
          <div className="kpi-value text-danger"><AnimatedNumber value={counts.blocked} /> <span className="kpi-sub">({Math.round((counts.blocked/(counts.total||1))*100)}%)</span></div>
        </GlassCard>
        <GlassCard className="kpi-card kpi-highlight">
          <div className="kpi-label">Fraud Prevented Today</div>
          <div className="kpi-value highlight-value text-success">
            <AnimatedNumber value={fraudPreventedValue} prefix="₹" />
          </div>
        </GlassCard>
      </div>

      <div className="main-grid">
        {/* Active Alerts */}
        <div className="alerts-panel">
          <h3 className="panel-title">Active Alerts</h3>
          <div className="alerts-list">
            <GlassCard className="alert-card" glowColor="var(--danger)" onClick={() => navigate('/rings')}>
              <div className="alert-header">
                <span className="pulse-dot"></span>
                <ShieldAlert size={18} className="text-danger" />
                <span className="alert-time">2 mins ago</span>
              </div>
              <div className="alert-title">Fraud Ring Detected</div>
              <div className="alert-desc">8 accounts connected — ₹13,59,200 at risk</div>
              <div className="alert-action">View Network <ArrowRight size={14}/></div>
            </GlassCard>

            {activeHighRiskReturn ? (
              <GlassCard className="alert-card clickable" glowColor="var(--warning)" onClick={() => navigate('/analyzer/' + activeHighRiskReturn.id)}>
                <div className="alert-header">
                  <span className="pulse-dot" style={{backgroundColor: 'var(--warning)', animation: 'none'}}></span>
                  <AlertCircle size={18} className="text-warning" />
                  <span className="alert-time">Action Required</span>
                </div>
                <div className="alert-title">High Risk Return</div>
                <div className="alert-desc">{activeHighRiskReturn.product} — ₹{activeHighRiskReturn.value?.toLocaleString()}</div>
                <div className="alert-action">Review Case <ArrowRight size={14}/></div>
              </GlassCard>
            ) : (
              <GlassCard className="alert-card" glowColor="var(--success)">
                <div className="alert-header">
                  <CheckCircle size={18} className="text-success" />
                  <span className="alert-time">Queue Clear</span>
                </div>
                <div className="alert-title text-success">All Caught Up</div>
                <div className="alert-desc">No high risk returns pending review.</div>
              </GlassCard>
            )}
          </div>

          <h3 className="panel-title" style={{marginTop: '32px'}}>Fraud Typology</h3>
          <GlassCard className="chart-card">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={fraudData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {fraudData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        {/* Recent Returns Table */}
        <div className="table-panel">
          <GlassCard className="table-card">
            <div className="table-header-flex">
              <h3 className="panel-title" style={{marginBottom: 0}}>
                {statusFilter ? `${statusFilter.replace('_', ' ').toUpperCase()} Returns` : 'Recent Returns'}
              </h3>
              <button className="btn-secondary" onClick={() => navigate('/returns')}><TrendingUp size={16}/> View All</button>
            </div>
            
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Return ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Value</th>
                    <th>Risk Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.slice(0, 5).map((r) => (
                    <tr key={r.id} onClick={() => navigate(`/analyzer/${r.id}`)} className="clickable-row">
                      <td className="mono text-secondary">#{r.id}</td>
                      <td className="font-medium">{r.customerName}</td>
                      <td>{r.product}</td>
                      <td className="mono">₹{r.value?.toLocaleString()}</td>
                      <td><RiskBadge score={r.fraudScore} /></td>
                      <td><RiskBadge status={r.status} /></td>
                    </tr>
                  ))}
                  {filteredReturns.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-secondary">
                        Loading returns or no data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
