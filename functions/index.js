const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp();
const db = admin.firestore();

// Haversine formula for distance in km
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.scoreReturnRequest = onDocumentCreated("returns/{returnId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const returnData = snapshot.data();
  const returnId = event.params.returnId;
  
  // Skip if already processed (has status)
  if (returnData.status) return;

  let score = 0;
  const signals = [];
  const networkSignalsList = [];
  let fraudType = "unknown";

  // --- INDIVIDUAL SIGNALS ---
  const age = returnData.accountAgeDays || 0;
  if (age < 30) {
    score += 25;
    signals.push("new_account");
  }
  if (age < 7) {
    score += 15;
    signals.push("very_new_account");
  }

  const value = returnData.value || 0;
  if (value > 50000) {
    score += 10;
    signals.push("high_value");
  }
  if (value > 100000) {
    score += 15;
    signals.push("very_high_value");
  }

  const rate = returnData.returnRate || 0;
  if (rate > 0.5) {
    score += 30;
    signals.push("high_return_rate");
  }
  if (rate > 0.8) {
    score += 15;
    signals.push("very_high_return_rate");
  }

  const prevINR = returnData.previousINRClaims || 0;
  if (prevINR > 1) {
    score += 20;
    signals.push("multiple_inr_claims");
    fraudType = "inr_abuse";
  }

  const prevDamage = returnData.previousDamageClaims || 0;
  if (prevDamage > 1) {
    score += 25;
    signals.push("multiple_damage_claims");
    fraudType = "damage_abuse";
  }

  // Calculate days since purchase
  const purchaseDate = new Date(returnData.purchaseDate);
  const returnDate = new Date(returnData.returnDate);
  const daysSincePurchase = (returnDate - purchaseDate) / (1000 * 60 * 60 * 24);

  if (daysSincePurchase < 3 && returnData.category === "apparel") {
    score += 15;
    signals.push("rapid_apparel_return");
    fraudType = "wardrobing";
  }

  // --- NETWORK SIGNALS ---
  // Fetch recent returns to compare
  const returnsQuery = await db.collection("returns").where("customerId", "!=", returnData.customerId).get();
  const otherReturns = returnsQuery.docs.map(d => ({ id: d.id, ...d.data() }));

  const connectedReturns = new Set();
  const strongNetworkSignals = [];

  // Device check
  if (returnData.deviceId) {
    const sameDevice = otherReturns.filter(r => r.deviceId === returnData.deviceId);
    if (sameDevice.length > 0) {
      score += 40;
      signals.push("shared_device");
      strongNetworkSignals.push({ type: "device", score: 40 });
      sameDevice.forEach(r => connectedReturns.add(r.id));
    }
  }

  // Payment check
  if (returnData.paymentLast4) {
    const samePaymentDiffName = otherReturns.filter(r => 
      r.paymentLast4 === returnData.paymentLast4 && 
      r.customerName !== returnData.customerName
    );
    if (samePaymentDiffName.length > 0) {
      score += 40;
      signals.push("shared_payment_diff_name");
      strongNetworkSignals.push({ type: "payment", score: 40 });
      samePaymentDiffName.forEach(r => connectedReturns.add(r.id));
    }
  }

  // Address check
  if (returnData.shippingLat && returnData.shippingLng) {
    const nearby = otherReturns.filter(r => {
      if (!r.shippingLat || !r.shippingLng) return false;
      const dist = getDistanceFromLatLonInKm(
        returnData.shippingLat, returnData.shippingLng,
        r.shippingLat, r.shippingLng
      );
      return dist <= 1.0;
    });
    if (nearby.length > 0) {
      score += 30;
      signals.push("nearby_address");
      strongNetworkSignals.push({ type: "address", score: 30 });
      nearby.forEach(r => connectedReturns.add(r.id));
    }
  }

  // Product check
  if (returnData.product) {
    const sameProduct = otherReturns.filter(r => r.product === returnData.product);
    // Needs 3+ different accounts (including this one, so 2+ others)
    const uniqueAccounts = new Set(sameProduct.map(r => r.customerId));
    if (uniqueAccounts.size >= 2) {
      score += 20;
      signals.push("velocity_same_product");
    }
  }

  // --- GANG DETECTION ---
  let gangId = null;
  let isGangMember = false;

  const validNetworkSignals = strongNetworkSignals.filter(s => s.score >= 30);
  if (validNetworkSignals.length >= 2) {
    isGangMember = true;
    
    // Check if any connected return is already in a gang
    const connectedDocs = await Promise.all(
      Array.from(connectedReturns).map(id => db.collection("returns").doc(id).get())
    );
    
    const existingGangReturn = connectedDocs.find(doc => doc.data()?.gangId);
    
    if (existingGangReturn) {
      gangId = existingGangReturn.data().gangId;
      // Join existing ring
      const ringRef = db.collection("fraudRings").doc(gangId);
      await ringRef.update({
        memberReturnIds: FieldValue.arrayUnion(returnId),
        totalValue: FieldValue.increment(value)
      });
    } else {
      // Create new ring
      const newRingRef = db.collection("fraudRings").doc();
      gangId = "FR-" + new Date().getFullYear() + "-" + newRingRef.id.substring(0, 4).toUpperCase();
      
      const allMembers = [returnId, ...connectedReturns];
      let totalRingValue = value;
      connectedDocs.forEach(d => { totalRingValue += (d.data()?.value || 0); });

      await db.collection("fraudRings").doc(gangId).set({
        ringId: gangId,
        detectedAt: FieldValue.serverTimestamp(),
        memberReturnIds: allMembers,
        totalValue: totalRingValue,
        connectionTypes: validNetworkSignals.map(s => s.type),
        status: "active",
        strongSignals: ["auto_detected_network"],
        mediumSignals: [],
        weakSignals: []
      });

      // Update connected returns with new gangId
      const batch = db.batch();
      connectedReturns.forEach(id => {
        batch.update(db.collection("returns").doc(id), { 
          gangId, 
          status: "blocked",
          fraudScore: 100 // Gang members get max risk
        });
      });
      await batch.commit();
    }
  }

  // --- DECISION ---
  let finalStatus = "under_review";
  
  if (isGangMember) {
    finalStatus = "blocked";
    score = 100;
  } else if (score <= 30) {
    finalStatus = "auto_approved";
  } else if (score <= 60) {
    finalStatus = "under_review";
  } else {
    finalStatus = "blocked";
  }

  // Bound score
  score = Math.min(100, Math.max(0, score));

  if (fraudType === "unknown" && score > 30) {
    fraudType = "wardrobing"; // Default to something for demo
  }

  // Write back
  await snapshot.ref.update({
    fraudScore: score,
    fraudSignals: signals,
    fraudType,
    gangId,
    status: finalStatus,
    updatedAt: FieldValue.serverTimestamp()
  });
});
