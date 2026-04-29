import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import GlassCard from '../components/GlassCard';
import RiskBadge from '../components/RiskBadge';
import { ArrowLeft } from 'lucide-react';
import './Dashboard.css'; // Reuse dashboard table styles

const ReturnsList = () => {
  const [returns, setReturns] = useState([]);
  const navigate = useNavigate();

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

  return (
    <div className="dashboard">
      <header className="page-header flex items-center gap-4">
        <button className="btn-secondary" style={{padding: '8px', border: '1px solid var(--border-card)'}} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>All Returns</h1>
          <p className="text-secondary">Complete history of all processed returns</p>
        </div>
      </header>

      <div className="table-panel">
        <GlassCard className="table-card">
          <div className="table-header-flex">
            <h3 className="panel-title" style={{marginBottom: 0}}>Total Record Count: {returns.length}</h3>
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
                {returns.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/analyzer/${r.id}`)} className="clickable-row">
                    <td className="mono text-secondary">#{r.id}</td>
                    <td className="font-medium">{r.customerName}</td>
                    <td>{r.product}</td>
                    <td className="mono">₹{r.value?.toLocaleString()}</td>
                    <td><RiskBadge score={r.fraudScore} /></td>
                    <td><RiskBadge status={r.status} /></td>
                  </tr>
                ))}
                {returns.length === 0 && (
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
  );
};

export default ReturnsList;
