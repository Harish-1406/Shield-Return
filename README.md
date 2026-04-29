# 🛡️ ShieldReturn

**ShieldReturn** is an AI-powered, real-time fraud intelligence platform built to protect e-commerce companies from organized return fraud, wardrobing, and Item Not Received (INR) abuse. 

Traditional fraud prevention relies on human analysts manually reviewing spreadsheets—a process that is slow, expensive, and completely blind to organized crime rings. ShieldReturn automates the entire process, using behavioral scoring and network analysis to instantly auto-approve legitimate customers while simultaneously taking down entire fraud rings in milliseconds.

## ✨ Key Features

* **Real-Time Triage Dashboard:** Monitor live e-commerce traffic. Legitimate returns (which make up ~90% of traffic) are instantly Auto-Approved, ensuring a frictionless customer experience.
* **AI Risk Scoring:** Every return is intercepted by a serverless backend engine that calculates a Risk Score (0-100) based on behavioral anomalies (e.g., Burner Accounts, Serial Returners, Wardrobing).
* **Automated Fraud Ring Takedowns:** The AI scans the database for "invisible connections" (shared Device IDs, matching IP addresses, or close physical proximity). If multiple returns share strong network signals, the AI mathematically clusters them into a "Gang" and automatically blocks all connected accounts simultaneously.
* **Network Graph Intelligence:** Complex fraud rings are mapped out visually using D3.js physics engines, allowing security analysts to instantly understand the scope of an attack.

## 💻 Tech Stack

* **Frontend:** React.js, Vite, Vanilla CSS (Glassmorphism UI), D3.js (Network Visualization), Lucide React (Icons).
* **Backend:** Firebase Cloud Functions (Node.js AI Engine), Firebase Firestore (NoSQL Database).
* **Connectivity:** Firebase WebSockets (`onSnapshot`) for real-time UI reactivity without page refreshes.
* **Testing Engine:** Custom Node.js live-traffic simulator (`simulate.js`) using the Birthday Paradox and mathematical clustering to generate and test live fraud attacks.

## 🚀 How to Run Locally

Because this project relies on a live database and cloud functions, we use the **Firebase Local Emulator Suite** to run the entire backend completely offline.

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
cd ..
```

### 2. Start the Backend (Firebase Emulator)
You must have the Firebase CLI installed (`npm install -g firebase-tools`) and Java installed (required for the Firestore emulator).

```bash
# Start the local database and cloud functions
firebase emulators:start
```
*The Firestore Database UI will be available at `http://127.0.0.1:4000`*

### 3. Start the Frontend
In a new terminal window:
```bash
npm run dev
```
*The React Dashboard will be available at `http://localhost:5174`*

### 4. Run the Live Traffic Simulator
To watch the dashboard come alive with real-time data and simulated fraud attacks, open a third terminal window:
```bash
cd functions
node scripts/simulate.js
```

## 🧠 The Fraud Algorithm

When a return is requested, the AI checks for:
1. **Value:** High-value items receive stricter scrutiny.
2. **Burner Accounts:** Accounts < 30 days old are flagged.
3. **Wardrobing:** Apparel returned within 3 days of purchase receives a penalty.
4. **Network Signals:** Sharing a Device ID (+40 pts), Payment Method (+40 pts), or physical Drop-off Location (+30 pts) with another account instantly triggers an Organized Crime alert.
