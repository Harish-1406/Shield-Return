import React, { useEffect, useState } from 'react';
import './GaugeChart.css';

const GaugeChart = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate score from 0 to actual score
    const duration = 1000; // 1s
    const steps = 60;
    const stepTime = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      // Easing function (easeOutCubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeProgress * score));

      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedScore(score);
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [score]);

  // Semi-circle math
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  let color = 'var(--success)';
  let label = 'LOW RISK';
  if (score > 30) {
    color = 'var(--warning)';
    label = 'MEDIUM RISK';
  }
  if (score > 70) {
    color = 'var(--danger)';
    label = 'HIGH RISK';
  }

  return (
    <div className="gauge-container">
      <svg className="gauge-svg" viewBox="0 0 200 120">
        {/* Background Arc */}
        <path
          className="gauge-bg"
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--border-card)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <path
          className="gauge-progress"
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="gauge-content">
        <div className="gauge-score mono" style={{ color }}>{animatedScore}</div>
        <div className="gauge-label">{label}</div>
      </div>
    </div>
  );
};

export default GaugeChart;
