import React from 'react';
import clsx from 'clsx';
import './RiskBadge.css';

// 0-30 green, 31-70 amber, 71-100 red
const getScoreColor = (score) => {
  if (score <= 30) return 'green';
  if (score <= 70) return 'amber';
  return 'red';
};

const getStatusColor = (status) => {
  switch(status) {
    case 'auto_approved': return 'green';
    case 'under_review': return 'amber';
    case 'blocked': return 'red';
    case 'gang_member': return 'red';
    default: return 'gray';
  }
};

const formatStatus = (status) => {
  if (!status) return '';
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const RiskBadge = ({ score, status, className }) => {
  if (score !== undefined) {
    const color = getScoreColor(score);
    return (
      <span className={clsx('risk-badge', `badge-${color}`, className)}>
        {score} / 100
      </span>
    );
  }

  if (status) {
    const color = getStatusColor(status);
    return (
      <span className={clsx('risk-badge', `badge-${color}`, className)}>
        {formatStatus(status)}
      </span>
    );
  }

  return null;
};

export default RiskBadge;
