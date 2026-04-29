# 🛡️ ShieldReturn

## 🚨 Problem Statement

Online retailers lose an estimated **$101 billion annually** to return fraud. Unlike payment fraud, return fraud is harder to detect because it exploits a process that is supposed to be generous—lenient return policies are a deliberate business decision to build customer trust. Fraudsters weaponize that trust at scale.

The challenge is not simply detecting fraud. It is doing so **without making the 96–98% of legitimate customers feel like suspects.**

## 💡 Proposed Solution

**ShieldReturn** is an AI-powered, real-time fraud intelligence platform that solves the tension between customer experience and risk management. 

Instead of treating every customer like a potential threat, ShieldReturn intercepts returns the millisecond they are requested and evaluates them dynamically:

1. **The Fast Lane (Auto-Approval):** Clean, low-risk customers are instantly approved, protecting the brand's reputation and preserving the seamless e-commerce experience.
2. **The Triage Queue (Manual Review):** Individual returns exhibiting suspicious behavior (e.g., wardrobing, high velocity, or excessive "Item Not Received" claims) are flagged and held for manual review by an analyst.
3. **Automated Takedowns (Organized Crime):** ShieldReturn shines at catching invisible fraud rings. By running continuous mathematical clustering on background identifiers (Device IDs, partial payment methods, and geographic proximity), the AI connects the dots. When a highly-coordinated gang attack is detected, the system automatically blocks the entire network simultaneously, preventing massive financial extraction.

## 💻 Tech Stack

* **Frontend:** React.js, Vite, Vanilla CSS (Glassmorphism aesthetics)
* **Visualizations:** D3.js (Physics-based Network Mapping), Lucide React
* **Backend Engine:** Firebase Cloud Functions (Node.js Serverless AI Logic)
* **Database & Real-time Sync:** Firebase Firestore (NoSQL), WebSockets (`onSnapshot` for zero-latency dashboard updates)
* **Testing / Simulation:** Custom Node.js live-traffic simulator (`simulate.js`) that injects mathematical probabilities and coordinated "Live Attacks" to test the AI engine.

## 🗺️ Future Roadmap

1. **Machine Learning Integration:** Transition from heuristic weighting algorithms to a fully-trained Random Forest model trained on millions of historical e-commerce return data points.
2. **Shopify/WooCommerce Plugin:** Package the ShieldReturn backend logic into a one-click installable plugin for major e-commerce platforms.
3. **Carrier API Integration:** Connect directly to FedEx/UPS/DHL APIs to verify tracking weights (e.g., stopping fraudsters from returning boxes filled with bricks instead of laptops).
4. **Automated Evidence Generation:** Generate downloadable, formatted PDF dossiers of entire fraud rings that can be instantly forwarded to law enforcement or legal teams.

---

### How to Run Locally

```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Start the Firebase Local Database & AI Backend
firebase emulators:start

# 3. Start the React Frontend Dashboard (in a new terminal)
npm run dev

# 4. Start the Live Traffic Simulator (in a new terminal)
cd functions && node scripts/simulate.js
```
