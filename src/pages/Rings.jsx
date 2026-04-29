import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import GlassCard from '../components/GlassCard';
import NetworkGraph from '../components/NetworkGraph';
import RiskBadge from '../components/RiskBadge';
import { Network, AlertCircle, ShieldAlert, Download, Ban, Eye } from 'lucide-react';
import './Rings.css';

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

function timeAgo(date) {
  if (!date) return 'Just now';
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + " mins ago";
  return "Just now";
}

const Rings = () => {
  const [rings, setRings] = useState([]);
  const [selectedRing, setSelectedRing] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRings = async () => {
      const q = query(collection(db, "fraudRings"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRings(data);
      if (data.length > 0) {
        setSelectedRing(data[0]);
      }
      setLoading(false);
    };
    fetchRings();
  }, []);

  useEffect(() => {
    if (!selectedRing) return;

    const fetchGraphData = async () => {
      // For the prototype, we fetch all returns in the ring
      // In a real app, we might just query the specific returns
      const q = query(collection(db, "returns"));
      const snapshot = await getDocs(q);
      const allReturns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const members = allReturns.filter(r => selectedRing.memberReturnIds.includes(r.id));
      
      const nodes = members.map(m => ({
        id: m.id,
        name: m.customerName,
        value: m.value,
        score: m.fraudScore,
        product: m.product
      }));

      // Generate edges based on simple heuristics for the visual
      const links = [];
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          const a = members[i];
          const b = members[j];
          
          if (a.deviceId && a.deviceId === b.deviceId) {
            links.push({ source: a.id, target: b.id, type: 'device' });
          } else if (a.paymentLast4 && a.paymentLast4 === b.paymentLast4) {
            links.push({ source: a.id, target: b.id, type: 'payment' });
          } else if (a.ipAddress && a.ipAddress === b.ipAddress) {
            links.push({ source: a.id, target: b.id, type: 'ip' });
          } else if (a.shippingLat && b.shippingLat && getDistanceFromLatLonInKm(a.shippingLat, a.shippingLng, b.shippingLat, b.shippingLng) <= 1.0) {
            links.push({ source: a.id, target: b.id, type: 'address' });
          } else if (a.product === b.product) {
            // weak connection just for visual if no strong ones exist
            links.push({ source: a.id, target: b.id, type: 'product' });
          }
        }
      }

      setGraphData({ nodes, links });
    };

    fetchGraphData();
  }, [selectedRing]);

  if (loading) return <div className="p-8 text-center text-secondary">Loading intel...</div>;

  return (
    <div className="rings-page">
      <header className="page-header">
        <h1>Fraud Ring Intelligence</h1>
        <p className="text-secondary">AI-powered network detection and automated takedowns</p>
      </header>

      <div className="rings-layout">
        {/* Left Panel */}
        <div className="rings-sidebar">
          <h3 className="panel-title mb-4">Detected Rings</h3>
          <div className="rings-list">
            {rings.map(ring => (
              <GlassCard 
                key={ring.id} 
                className={`ring-card ${selectedRing?.id === ring.id ? 'active' : ''}`}
                onClick={() => setSelectedRing(ring)}
                glowColor={ring.status === 'active' ? 'var(--danger)' : 'var(--primary)'}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="ring-id mono">{ring.ringId}</div>
                  <RiskBadge status={ring.status} />
                </div>
                <div className="text-secondary text-sm mb-3">
                  Detected {timeAgo(ring.detectedAt?.toDate?.())}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2"><Network size={14}/> {ring.memberReturnIds?.length} Accounts</span>
                  <span className="font-medium text-danger mono">₹{ring.totalValue?.toLocaleString()}</span>
                </div>
              </GlassCard>
            ))}
            {rings.length === 0 && <div className="text-secondary p-4">No fraud rings detected.</div>}
          </div>
        </div>

        {/* Right Panel */}
        <div className="rings-main">
          <GlassCard className="graph-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="panel-title mb-0">Network Graph</h3>
              <div className="graph-legend text-sm flex gap-4">
                <span className="flex items-center gap-2"><span className="legend-line line-red"></span> Device</span>
                <span className="flex items-center gap-2"><span className="legend-line line-orange"></span> Payment/IP</span>
                <span className="flex items-center gap-2"><span className="legend-line line-yellow" style={{ borderTop: '2px dashed #FADB14' }}></span> Address</span>
                <span className="flex items-center gap-2"><span className="legend-line line-gray"></span> Product</span>
              </div>
            </div>
            <div className="graph-wrapper">
              {graphData.nodes.length > 0 ? (
                <NetworkGraph nodes={graphData.nodes} links={graphData.links} />
              ) : (
                <div className="text-center p-8 text-secondary">Select a ring to view its network.</div>
              )}
            </div>
          </GlassCard>

          {/* Details below graph */}
          {selectedRing && (
            <div className="intel-grid mt-6">
              <GlassCard className="details-card">
                <h3 className="text-sm uppercase text-secondary font-bold tracking-wider mb-4">Connection Details</h3>
                <div className="space-y-4">
                  <div className="intel-block">
                    <div className="flex items-center gap-2 text-danger font-medium mb-1">
                      <ShieldAlert size={16} /> STRONG SIGNALS (High Confidence)
                    </div>
                    <ul className="text-sm text-secondary list-disc pl-5 space-y-1">
                      {selectedRing.connectionTypes?.includes('device') && <li>Multiple accounts share <b>DEVICE ID</b> (Same physical device used for fake identities)</li>}
                      {selectedRing.connectionTypes?.includes('payment') && <li>Multiple accounts share <b>PAYMENT METHOD</b> (Same funding source)</li>}
                      {selectedRing.connectionTypes?.includes('address') && <li>Accounts share <b>NEARBY ADDRESSES</b> (&lt; 1km proximity)</li>}
                    </ul>
                  </div>
                  <div className="intel-block">
                    <div className="flex items-center gap-2 text-warning font-medium mb-1">
                      <AlertCircle size={16} /> OTHER SIGNALS
                    </div>
                    <ul className="text-sm text-secondary list-disc pl-5 space-y-1">
                      <li>Returns submitted within narrow time window</li>
                      <li>Identical high-value product targets</li>
                    </ul>
                  </div>
                </div>
              </GlassCard>

              <div className="action-col flex flex-col gap-6">
                <GlassCard className="impact-card" glowColor="var(--success)">
                  <div className="text-sm text-secondary mb-2 uppercase">Impact Comparison</div>
                  <div className="impact-text text-sm">
                    <div className="mb-2">
                      <span className="text-secondary">WITHOUT NETWORK DETECTION</span><br/>
                      Blocked single return → ₹899 saved
                    </div>
                    <div className="pt-2 border-t border-[var(--border-card)]">
                      <span className="text-success font-bold">WITH SHIELDRETURN NETWORK</span><br/>
                      Blocked all {selectedRing.memberReturnIds?.length} accounts → <b>₹{selectedRing.totalValue?.toLocaleString()} saved</b>
                      <div className="text-right text-success text-xl font-bold mt-1 tracking-wider">{(selectedRing.totalValue/899).toFixed(1)}x 🚀</div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="action-card" glowColor="var(--success)">
                  <h3 className="text-success font-bold flex items-center gap-2 mb-2">
                    <ShieldAlert size={18}/> AUTOMATED TAKEDOWN SUCCESSFUL
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    ShieldReturn AI automatically blocked all {selectedRing.memberReturnIds?.length} connected accounts simultaneously, preventing fraudsters from extracting further value.
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <button className="btn-action w-full bg-[rgba(82,196,26,0.1)] text-success hover:bg-success hover:text-white border border-[rgba(82,196,26,0.3)] rounded px-4 py-2 flex items-center justify-center gap-2 font-bold transition-all cursor-pointer">
                      <Eye size={16}/> View Takedown Audit Log
                    </button>
                    <button className="btn-action w-full bg-white/5 text-secondary hover:text-white border border-white/10 rounded px-4 py-2 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer mt-2">
                      <Download size={16}/> Export Evidence PDF
                    </button>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Rings;
