process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

admin.initializeApp({ projectId: "demo-project" });
const db = admin.firestore();

const seedData = async () => {
  console.log("Seeding Database...");
  
  // Clean existing data
  const returns = await db.collection("returns").get();
  const batches1 = [];
  returns.docs.forEach((doc) => batches1.push(doc.ref.delete()));
  await Promise.all(batches1);

  const rings = await db.collection("fraudRings").get();
  const batches2 = [];
  rings.docs.forEach((doc) => batches2.push(doc.ref.delete()));
  await Promise.all(batches2);

  // Generate Returns
  const allReturns = [];

  // 1. 8 returns — Fraud Ring (FR-2026-001) - Shared device, payment, nearby addresses, MacBook Pro
  for (let i = 1; i <= 8; i++) {
    allReturns.push({
      customerId: `ring1_cust_${i}`,
      customerName: `Fake User ${i}`,
      product: "MacBook Pro 14\"",
      value: 169900,
      reason: "Arrived damaged",
      purchaseDate: "2026-04-10",
      returnDate: "2026-04-20",
      accountAgeDays: 2,
      returnRate: 1.0,
      deviceId: "chrome-win10-gang1-xyz",
      ipAddress: "103.24.88.12",
      ipRegion: "Chennai, IN",
      paymentLast4: "4582",
      shippingAddress: `12${i} Oak St`,
      shippingLat: 13.0827 + (i * 0.001), // close to each other
      shippingLng: 80.2707 + (i * 0.001),
      category: "electronics"
    });
  }

  // 2. 5 returns — Fraud Ring (FR-2026-002) - Shared IP, different products, INR claims
  for (let i = 1; i <= 5; i++) {
    allReturns.push({
      customerId: `ring2_cust_${i}`,
      customerName: `Scammer ${i}`,
      product: `Electronics Gadget ${i}`,
      value: 25000 + (i * 2000),
      reason: "Item not received",
      purchaseDate: "2026-03-01",
      returnDate: "2026-03-20",
      accountAgeDays: 15,
      returnRate: 0.7,
      deviceId: `device-mobile-${i}`,
      ipAddress: "188.100.22.1", // shared IP
      ipRegion: "London, UK",
      paymentLast4: "7777", // shared payment
      shippingAddress: `${i} High St`,
      shippingLat: 51.5074,
      shippingLng: -0.1278,
      category: "electronics",
      previousINRClaims: 2
    });
  }

  // 3. 6 returns — Fraud Ring (FR-2026-003) - Shared Device and IP
  for (let i = 1; i <= 6; i++) {
    allReturns.push({
      customerId: `ring3_cust_${i}`,
      customerName: `Ghost User ${i}`,
      product: "Sony WH-1000XM5",
      value: 29900,
      reason: "Defective",
      purchaseDate: "2026-04-12",
      returnDate: "2026-04-18",
      accountAgeDays: 5,
      returnRate: 0.9,
      deviceId: "device-desktop-fraud-333", // shared device
      ipAddress: "103.44.11.99", // shared IP
      ipRegion: "Bengaluru, IN",
      paymentLast4: `${8000 + i}`,
      shippingAddress: `${i} Tech Park`,
      shippingLat: 12.9716 + (i * 0.05), // Spread out geographically
      shippingLng: 77.5946 + (i * 0.05),
      category: "electronics"
    });
  }

  // 4. 4 returns — Fraud Ring (FR-2026-004) - Shared Payment and Nearby Address
  for (let i = 1; i <= 4; i++) {
    allReturns.push({
      customerId: `ring4_cust_${i}`,
      customerName: `Sneakerhead ${i}`,
      product: "Nike Air Max",
      value: 12500,
      reason: "Wrong size",
      purchaseDate: "2026-04-20",
      returnDate: "2026-04-22",
      accountAgeDays: 8,
      returnRate: 1.0,
      deviceId: `device-tablet-${i}`,
      ipAddress: `45.22.11.${i}`,
      ipRegion: "Delhi, IN",
      paymentLast4: "5555", // shared payment
      shippingAddress: `Sector ${i} Dwarka`,
      shippingLat: 28.5823 + (i * 0.001), // Very close to each other
      shippingLng: 77.0500 + (i * 0.001),
      category: "apparel"
    });
  }

  // 5. 4 returns — Individual wardrobing - bought dresses, returned within 2 days, 80%+ return rate
  for (let i = 1; i <= 4; i++) {
    allReturns.push({
      customerId: `wardrobe_cust_${i}`,
      customerName: `Fashion Buyer ${i}`,
      product: "Designer Silk Dress",
      value: 45000,
      reason: "Does not fit",
      purchaseDate: "2026-04-25",
      returnDate: "2026-04-26", // within 2 days
      accountAgeDays: 120,
      returnRate: 0.85,
      deviceId: `device-iphone-${i}`,
      ipAddress: `72.14.192.${i}`,
      ipRegion: "New York, US",
      paymentLast4: `${2000 + i}`,
      shippingAddress: `Apt ${i} NY`,
      shippingLat: 40.7128,
      shippingLng: -74.0060,
      category: "apparel"
    });
  }

  // 4. 3 returns — INR abuse - 3+ previous INR claims
  for (let i = 1; i <= 3; i++) {
    allReturns.push({
      customerId: `inr_cust_${i}`,
      customerName: `Missing Pkg ${i}`,
      product: "AirPods Pro",
      value: 24900,
      reason: "Item not received",
      purchaseDate: "2026-04-01",
      returnDate: "2026-04-15",
      accountAgeDays: 60,
      returnRate: 0.4,
      deviceId: `device-android-${i}`,
      ipAddress: `11.22.33.${i}`,
      ipRegion: "Chicago, US",
      paymentLast4: `${3000 + i}`,
      shippingAddress: `${i} Loop Rd`,
      shippingLat: 41.8781,
      shippingLng: -87.6298,
      category: "electronics",
      previousINRClaims: 4 // triggers inr_abuse
    });
  }

  // 5. 2 returns — Damage claim fraud - 2+ previous damage claims
  for (let i = 1; i <= 2; i++) {
    allReturns.push({
      customerId: `dmg_cust_${i}`,
      customerName: `Smasher ${i}`,
      product: "OLED TV",
      value: 125000,
      reason: "Arrived shattered",
      purchaseDate: "2026-04-10",
      returnDate: "2026-04-12",
      accountAgeDays: 45,
      returnRate: 0.5,
      deviceId: `device-seed-${Math.floor(Math.random() * 10000000)}`,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      ipRegion: "Mumbai, IN",
      paymentLast4: Math.floor(1000 + Math.random() * 900000).toString().slice(-4),
      shippingAddress: `${Math.floor(Math.random() * 9999)} Main St`,
      shippingLat: 19.0760 + (Math.random() * 2.0 - 1.0),
      shippingLng: 72.8777 + (Math.random() * 2.0 - 1.0),
      category: "electronics",
      previousDamageClaims: 3 // triggers damage_abuse
    });
  }

  // 6. 100 returns — Legitimate customers - low score, clean history
  for (let i = 1; i <= 100; i++) {
    allReturns.push({
      customerId: `legit_cust_${i}`,
      customerName: `Good Shopper ${i}`,
      product: "Basic T-Shirt",
      value: 1200,
      reason: "Wrong size",
      purchaseDate: "2026-04-05",
      returnDate: "2026-04-15",
      accountAgeDays: 365 + i,
      returnRate: 0.05,
      deviceId: `device-mac-legit-${i}`,
      ipAddress: `10.0.${Math.floor(i / 255) % 255}.${i % 255}`,
      ipRegion: "Mumbai, IN",
      paymentLast4: (i % 10000).toString().padStart(4, '0'),
      shippingAddress: `${i} Tech Way`,
      shippingLat: 19.0760 + (i * 0.01),
      shippingLng: 72.8777 + (i * 0.01),
      category: "apparel"
    });
  }

  // We write them sequentially so the Cloud Function can process them one by one
  let startId = 10001;
  for (let i = 0; i < allReturns.length; i++) {
    const data = allReturns[i];
    const numericId = (startId + i).toString();
    await db.collection("returns").doc(numericId).set({
      ...data,
      createdAt: FieldValue.serverTimestamp()
    });
    console.log(`Added return ${i + 1}/${allReturns.length} for ${data.customerName}`);
    // Wait slightly to let Cloud Function process them roughly in order
    await new Promise(r => setTimeout(r, 500));
  }

  console.log("Seeding complete! Check your emulator UI at localhost:4000");
  process.exit(0);
};

seedData().catch(console.error);
