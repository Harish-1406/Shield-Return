import React from 'react';
import { 
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import GlassCard from '../components/GlassCard';
import { Download, Lightbulb } from 'lucide-react';
import './Analytics.css';

// Mock data for charts
const dailyData = [
  { date: 'Apr 01', approved: 120, fraud: 12 },
  { date: 'Apr 05', approved: 132, fraud: 15 },
  { date: 'Apr 10', approved: 101, fraud: 8 },
  { date: 'Apr 15', approved: 145, fraud: 22 },
  { date: 'Apr 20', approved: 160, fraud: 18 },
  { date: 'Apr 25', approved: 150, fraud: 35 }, // Spike
  { date: 'Apr 29', approved: 127, fraud: 29 },
];

const typeData = [
  { type: 'Wardrobing', count: 145, value: 4500000 },
  { type: 'INR Abuse', count: 85, value: 2200000 },
  { type: 'Damage Claims', count: 42, value: 3800000 },
  { type: 'Receipt Fraud', count: 18, value: 900000 },
];

const scatterData = [
  { age: 2, value: 169900, fraud: 1 },
  { age: 5, value: 125000, fraud: 1 },
  { age: 15, value: 35000, fraud: 1 },
  { age: 45, value: 45000, fraud: 1 },
  { age: 120, value: 24900, fraud: 1 },
  { age: 365, value: 1200, fraud: 0 },
  { age: 200, value: 15000, fraud: 0 },
  { age: 10, value: 5000, fraud: 0 },
  { age: 30, value: 8000, fraud: 0 },
  { age: 2, value: 250000, fraud: 1 },
];

const Analytics = () => {
  const handleExport = () => {
    window.print();
  };

  return (
    <div className="analytics-page">
      <header className="page-header flex justify-between items-end">
        <div>
          <h1>Analytics & Reports</h1>
          <p className="text-secondary">System performance and fraud trends</p>
        </div>
        <button className="btn-primary" onClick={handleExport}>
          <Download size={16} /> Export Report PDF
        </button>
      </header>

      {/* KPIs */}
      <div className="kpi-grid-4">
        <GlassCard className="kpi-card">
          <div className="kpi-label">Returns Processed</div>
          <div className="kpi-value mono">3,847</div>
        </GlassCard>
        <GlassCard className="kpi-card" glowColor="var(--success)">
          <div className="kpi-label">Fraud Prevented</div>
          <div className="kpi-value mono text-success">₹3,58,40,000</div>
        </GlassCard>
        <GlassCard className="kpi-card">
          <div className="kpi-label">False Positive Rate</div>
          <div className="kpi-value mono">3.2%</div>
        </GlassCard>
        <GlassCard className="kpi-card">
          <div className="kpi-label">Avg Detection Time</div>
          <div className="kpi-value mono">48 hrs</div>
        </GlassCard>
      </div>

      <div className="analytics-grid">
        {/* Line Chart */}
        <GlassCard className="chart-container">
          <h3 className="panel-title">Daily Return Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="approved" name="Approved Returns" stroke="var(--success)" strokeWidth={3} dot={{r:4}} />
              <Line type="monotone" dataKey="fraud" name="Fraud Attempts" stroke="var(--danger)" strokeWidth={3} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Bar Chart */}
        <GlassCard className="chart-container">
          <h3 className="panel-title">Fraud Types by Count</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
              <XAxis dataKey="type" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', borderRadius: '8px' }}
              />
              <Bar dataKey="count" name="Incident Count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Scatter Plot */}
        <GlassCard className="chart-container">
          <h3 className="panel-title">Risk Matrix: Account Age vs. Return Value</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
              <XAxis type="number" dataKey="age" name="Account Age (Days)" stroke="var(--text-secondary)" fontSize={12} tickLine={false} />
              <YAxis type="number" dataKey="value" name="Return Value (₹)" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                cursor={{strokeDasharray: '3 3'}}
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-card)', borderRadius: '8px' }}
              />
              <Scatter name="Safe" data={scatterData.filter(d=>d.fraud===0)} fill="var(--success)" />
              <Scatter name="Fraud" data={scatterData.filter(d=>d.fraud===1)} fill="var(--danger)" />
            </ScatterChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Insights & Stats */}
        <div className="insights-col">
          <GlassCard className="stats-box mb-6">
            <h3 className="panel-title mb-4">Gang Detection Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-[var(--border-card)] pb-2">
                <span className="text-secondary">Fraud Rings Detected</span>
                <span className="font-bold text-white mono">2</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-card)] pb-2">
                <span className="text-secondary">Avg Ring Size</span>
                <span className="font-bold text-white mono">6.5 accounts</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border-card)] pb-2">
                <span className="text-secondary">Avg Value per Ring</span>
                <span className="font-bold text-white mono text-danger">₹28,40,000</span>
              </div>
              <div>
                <span className="text-secondary text-sm block mb-2">Connection Types</span>
                <div className="flex gap-2 text-xs">
                  <span className="bg-white/10 px-2 py-1 rounded">Device 89%</span>
                  <span className="bg-white/10 px-2 py-1 rounded">Address 67%</span>
                  <span className="bg-white/10 px-2 py-1 rounded">Payment 44%</span>
                </div>
              </div>
            </div>
          </GlassCard>

          <h3 className="panel-title mb-4 text-primary flex items-center gap-2"><Lightbulb size={18}/> Smart Insights</h3>
          <div className="space-y-3">
            <GlassCard className="insight-card">
              "MacBook Pro is your most targeted product this month — 4 organized fraud attempts"
            </GlassCard>
            <GlassCard className="insight-card">
              "Tuesday 2-4 PM is peak fraud submission time — consider enhanced screening in this window"
            </GlassCard>
            <GlassCard className="insight-card">
              "Chennai IP range 103.24.x.x has generated 40% of flagged returns this week"
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
