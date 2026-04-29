process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp({ projectId: "demo-project" });
const db = admin.firestore();

const firstNames = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Rohan", "Neha"];
const lastNames = ["Sharma", "Patel", "Singh", "Kumar", "Gupta", "Das", "Jain", "Verma"];
const products = [
  { name: "iPhone 15 Pro", value: 134900, category: "electronics" },
  { name: "MacBook Air M2", value: 114900, category: "electronics" },
  { name: "Nike Air Max", value: 12500, category: "apparel" },
  { name: "Sony WH-1000XM5", value: 29900, category: "electronics" },
  { name: "Zara Summer Dress", value: 4500, category: "apparel" },
  { name: "Levi's 511 Jeans", value: 3200, category: "apparel" }
];
const reasons = ["Item not received", "Arrived damaged", "Wrong size", "Does not fit", "Changed my mind", "Defective"];

const generateRandomReturn = async () => {
  // Get the highest current ID to increment it
  const snapshot = await db.collection("returns").orderBy("createdAt", "desc").limit(1).get();
  let nextId = 20000;
  if (!snapshot.empty) {
    const lastDoc = snapshot.docs[0];
    const lastId = parseInt(lastDoc.id, 10);
    if (!isNaN(lastId)) {
      nextId = lastId + 1;
    }
  }

  const product = products[Math.floor(Math.random() * products.length)];
  const reason = reasons[Math.floor(Math.random() * reasons.length)];
  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  
  // Create a random return (mostly legitimate to simulate normal traffic)
  const data = {
    customerId: `live_cust_${Math.floor(Math.random() * 100000)}`,
    customerName: name,
    product: product.name,
    value: product.value,
    reason: reason,
    purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
    returnDate: new Date().toISOString().split('T')[0],
    accountAgeDays: Math.floor(Math.random() * 500) + 1,
    returnRate: Math.random() * 0.3, // Mostly low return rate
    deviceId: `device-live-${nextId}`,
    ipAddress: `192.168.${Math.floor((nextId % 65025) / 255)}.${nextId % 255}`,
    ipRegion: "Mumbai, IN",
    paymentLast4: (nextId % 10000).toString().padStart(4, '0'),
    shippingAddress: `${nextId} Main St`,
    shippingLat: 19.0760 + (nextId * 0.001),
    shippingLng: 72.8777 + (nextId * 0.001),
    category: product.category,
    createdAt: FieldValue.serverTimestamp()
  };

  // 2% chance of being an individual high-risk return (wardrobing or INR)
  if (Math.random() > 0.98) {
    data.returnRate = 0.85;
    data.accountAgeDays = 2;
    data.previousINRClaims = 3;
    console.log(`⚠️ Generating High-Risk Return for ${name}`);
  }

  const numericId = nextId.toString();
  await db.collection("returns").doc(numericId).set(data);
  console.log(`[${new Date().toLocaleTimeString()}] Inserted Return #${numericId} - ${data.product} (₹${data.value})`);
};

const generateLiveFraudRing = async () => {
  const snapshot = await db.collection("returns").orderBy("createdAt", "desc").limit(1).get();
  let nextId = 30000;
  if (!snapshot.empty) {
    const lastDoc = snapshot.docs[0];
    const lastId = parseInt(lastDoc.id, 10);
    if (!isNaN(lastId)) nextId = lastId + 1;
  }

  const ringSize = Math.floor(Math.random() * 3) + 3; // 3 to 5 accounts
  const sharedDevice = `device-live-gang-${Math.floor(Math.random() * 9999)}`;
  const sharedPayment = Math.floor(1000 + Math.random() * 9000).toString();
  const product = products[Math.floor(Math.random() * products.length)];
  
  console.log(`\n🚨 LIVE ATTACK DETECTED: Spawning Fraud Ring with ${ringSize} accounts...`);
  
  for (let i = 0; i < ringSize; i++) {
    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const data = {
      customerId: `live_gang_cust_${Math.floor(Math.random() * 100000)}`,
      customerName: name,
      product: product.name,
      value: product.value,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      purchaseDate: new Date(Date.now() - Math.floor(Math.random() * 10) * 86400000).toISOString().split('T')[0],
      returnDate: new Date().toISOString().split('T')[0],
      accountAgeDays: Math.floor(Math.random() * 5) + 1, // very new
      returnRate: 0.9,
      deviceId: sharedDevice, // SHARED
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      ipRegion: "Mumbai, IN",
      paymentLast4: sharedPayment, // SHARED
      shippingAddress: `${Math.floor(Math.random() * 9999)} Main St`,
      shippingLat: 19.0760 + (Math.random() * 2.0 - 1.0),
      shippingLng: 72.8777 + (Math.random() * 2.0 - 1.0),
      category: product.category,
      createdAt: FieldValue.serverTimestamp()
    };

    const numericId = (nextId + i).toString();
    await db.collection("returns").doc(numericId).set(data);
    console.log(`[${new Date().toLocaleTimeString()}] Inserted Ring Member #${numericId}`);
  }
};

const startSimulation = () => {
  console.log("🚀 Starting Live Traffic Simulator...");
  console.log("Press Ctrl+C to stop.");
  
  // Run immediately once
  generateRandomReturn();

  // Then loop every 4 to 8 seconds for a smooth, one-by-one increase
  const loop = () => {
    const delay = Math.floor(Math.random() * 4000) + 4000;
    setTimeout(async () => {
      try {
        // 2% chance of spawning a live fraud ring attack (very rare)
        if (Math.random() > 0.98) {
          await generateLiveFraudRing();
        } else {
          // Generate exactly ONE legitimate return to make the dashboard tick up smoothly
          await generateRandomReturn();
        }
      } catch (err) {
        console.error("Simulation error:", err);
      }
      loop();
    }, delay);
  };
  
  loop();
};

startSimulation();
