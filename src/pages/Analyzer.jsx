import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import GlassCard from '../components/GlassCard';
import RiskBadge from '../components/RiskBadge';
import GaugeChart from '../components/GaugeChart';
import { User, Package, ShieldAlert, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Network } from 'lucide-react';
import './Analyzer.css';

const Analyzer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnData, setReturnData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    const fetchReturn = async () => {
      const docRef = doc(db, "returns", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setReturnData({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchReturn();
  }, [id]);

  const handleDecision = async (decision) => {
    if (!returnData) return;
    try {
      const newStatus = decision === 'verify' ? 'pending_verification' : decision;
      await updateDoc(doc(db, "returns", returnData.id), {
        adminDecision: decision,
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      if (decision === 'verify') {
        setReturnData({ ...returnData, adminDecision: decision, status: newStatus });
      } else {
        try {
          // Fetch the next return in the queue
          const q = query(
            collection(db, "returns"), 
            where("status", "==", "under_review"), 
            limit(5)
          );
          const snapshot = await getDocs(q);
          const nextDoc = snapshot.docs.find(d => d.id !== returnData.id);
          
          if (nextDoc) {
            navigate(`/analyzer/${nextDoc.id}`);
          } else {
            navigate('/');
          }
        } catch (qErr) {
          console.error("Failed to fetch next item:", qErr);
          navigate('/');
        }
      }
    } catch (error) {
      console.error("Error updating decision", error);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-secondary">Loading analysis...</div>;
  }

  if (!returnData) {
    return <div className="p-8 text-center text-secondary">Select a return from the dashboard.</div>;
  }

  const isGangMember = !!returnData.gangId;

  return (
    <div className="analyzer">
      <div className="analyzer-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1>Return Analysis <span className="mono text-secondary text-sm ml-4">#{returnData.id}</span></h1>
      </div>

      <div className="analyzer-grid">
        {/* Left Column */}
        <div className="analyzer-col">
          <GlassCard className="info-card">
            <h3 className="card-title"><User size={18}/> Customer Profile</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name</span>
                <span className="info-value">{returnData.customerName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Account Age</span>
                <span className="info-value flex items-center gap-2">
                  {returnData.accountAgeDays} days
                  {returnData.accountAgeDays < 30 && <AlertTriangle size={14} className="text-warning"/>}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Return Rate</span>
                <span className="info-value flex items-center gap-2">
                  {Math.round((returnData.returnRate || 0) * 100)}%
                  {(returnData.returnRate || 0) > 0.5 && <AlertTriangle size={14} className="text-danger"/>}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Device IP Region</span>
                <span className="info-value">{returnData.ipRegion || 'Unknown'}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="info-card mt-6">
            <h3 className="card-title"><Package size={18}/> Return Details</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Product</span>
                <span className="info-value">{returnData.product}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Value</span>
                <span className="info-value mono">₹{returnData.value?.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Reason</span>
                <span className="info-value">"{returnData.reason}"</span>
              </div>
              <div className="info-item">
                <span className="info-label">Purchase Date</span>
                <span className="info-value">{returnData.purchaseDate}</span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Right Column */}
        <div className="analyzer-col">
          <GlassCard className="fraud-intel-card" glowColor={isGangMember ? "var(--danger)" : "var(--primary)"}>
            <h3 className="card-title"><ShieldAlert size={18}/> Fraud Intelligence</h3>
            
            <div className="gauge-wrapper">
              <GaugeChart score={returnData.fraudScore || 0} />
            </div>

            {isGangMember ? (
              <div className="gang-banner clickable" onClick={() => navigate('/rings')}>
                <Network size={20} />
                <div>
                  <strong>WARNING: ORGANIZED FRAUD RING DETECTED</strong>
                  <div className="text-sm opacity-80">Connected to {returnData.gangId}</div>
                </div>
              </div>
            ) : (
              <div className="safe-banner">
                <CheckCircle size={18} /> No network connections detected
              </div>
            )}

            <div className="signals-list">
              <h4 className="signals-title">Risk Signals</h4>
              {returnData.fraudSignals?.length > 0 ? (
                returnData.fraudSignals.map((signal, idx) => (
                  <div key={idx} className="signal-item">
                    <AlertTriangle size={16} className="text-warning" />
                    <div>
                      <div className="signal-name">{signal.replace(/_/g, ' ').toUpperCase()}</div>
                      <div className="signal-desc">System detected anomaly matching known fraud patterns.</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-secondary text-sm">No risk signals flagged.</div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Decision Panel */}
      {returnData.status === 'under_review' ? (
        <GlassCard className="decision-panel">
          <div className="decision-header">
            <h3>System Recommendation: <span className={returnData.fraudScore > 60 ? 'text-danger' : 'text-warning'}>
              {returnData.fraudScore > 60 ? 'BLOCK ACCOUNT' : 'REQUEST VERIFICATION'}
            </span></h3>
            <p className="text-secondary">Based on {returnData.fraudSignals?.length || 0} risk signals detected.</p>
          </div>

          <div className="decision-actions">
            <button 
              className={`btn-action btn-approve ${returnData.adminDecision === 'approved' ? 'active' : ''}`}
              onClick={() => handleDecision('approved')}
            >
              <CheckCircle size={18} />
              [A]pprove Anyway
            </button>
            <button 
              className={`btn-action btn-verify ${returnData.adminDecision === 'verify' ? 'active' : ''}`}
              onClick={() => handleDecision('verify')}
            >
              <ShieldAlert size={18} />
              [V]erify Identity
            </button>
            <button 
              className={`btn-action btn-block ${returnData.adminDecision === 'blocked' ? 'active' : ''}`}
              onClick={() => handleDecision('blocked')}
            >
              <XCircle size={18} />
              [B]lock Account
            </button>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="decision-panel" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div className="decision-header">
            <h3 className="text-success" style={{marginBottom: '8px'}}>Decision Recorded</h3>
            <p className="text-secondary">
              This return is marked as <strong style={{color: '#fff'}}>{returnData.status.replace('_', ' ').toUpperCase()}</strong>. No further action needed.
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default Analyzer;
