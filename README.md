# DemandFlow AI 📦🤖

> **AI-Based Demand & Supply Management System**  
> An enterprise-grade, full-stack predictive workflow optimizing product demand forecasting, inventory safety margins, warehouse logistics, and real-time replenishment lane balancing.

---

## 🚀 Project Overview

DemandFlow AI addresses critical real-world supply chain challenges:
* **Overstocking** which drives storage costs and inventory depreciation.
* **Understocking & Stockouts** causing revenue loss and missed customer orders.
* **Logistics Bottlenecks** due to inefficient transfer lanes and manual route planning.

The platform combines **Time-Series Machine Learning (Scikit-Learn Linear Regression)**, **Inventory Balancing Algorithms (Safety Stock / Reorder Point ROP)**, and a **Next.js & Tailwind CSS v4 Console** designed in accordance with **Material Design 3 (Material You)** aesthetics.

---

## 🎨 Design System: Material Design 3

The frontend console has been custom-crafted using curated color palettes, tonal surfaces, and micro-animations representing the Material Design 3 guidelines:
* **Wallpaper Color Wash**: Organic backdrop glows using dynamic radial blur shapes (`GlowOverlay.tsx`).
* **Interactive Tonal Containers**: Deep purple primary (`#6750A4`) and secondary lavender tonal states (`#E8DEF8`) responsive to hovering and active touch scaling.
* **Tactile Buttons**: Pill-shaped action triggers with fluid easing curves (`cubic-bezier(0.2, 0, 0, 1)`).

---

## 🛠️ High-Level System Architecture

```text
Sales + Weather + Promo Events
              │
              ▼
   ┌────────────────────┐
   │    Data Pipeline   │
   └──────────┬─────────┘
              │
              ▼
 ┌────────────────────────┐
 │Demand Forecasting Engine│ (Linear Regression v1, Confidence Bounds 95%)
 └────────────┬───────────┘
              │
              ▼
 ┌────────────────────────┐
 │Inventory Optimizer Engine│ (Safety Stock, ROP, Transfer Recommender)
 └────────────┬───────────┘
              │
              ▼
 ┌────────────────────────┐
 │Recommendation Scoring  │ (Decision Inbox, Ranked Opportunity Scoring)
 └────────────┬───────────┘
              │
              ▼
 ┌────────────────────────┐
 │  Next.js Console Web   │ (Dashboard, Live SKU Graphs, Inventory Matrix)
 └────────────────────────┘
```

---

## 📦 Directory Structure

```text
DemandFlow-AI/
├── apps/
│   ├── backend/                # FastAPI Core Engine (Python 3.13)
│   │   ├── app/
│   │   │   ├── database.py     # DB Engine & SQLite / Fallback Setup
│   │   │   ├── models.py       # User, Product, Inventory, Order models
│   │   │   ├── routers/        # Auth, Dashboard, Products, Recommendations
│   │   │   ├── services/       # Forecaster & Inventory safety stock logic
│   │   │   └── utils/          # Seeder script
│   │   └── requirements.txt
│   └── web/                    # Next.js Frontend Console
│       ├── app/                # App Router (globals.css, layout.tsx, page.tsx)
│       ├── components/         # Tab modules (Dashboard, Forecasting, Inventory)
│       └── components/ui/      # Base Material Design 3 UI controls
├── docker-compose.yml          # Container configuration for external databases
├── package.json                # Monorepo execution scripts (Concurrently)
└── README.md                   # System Documentation
```

---

## 🎛️ Technology Stack

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Next.js v16, Tailwind CSS v4 | Responsive layout with Material Design 3 tokens and Recharts visualization |
| **Backend** | FastAPI, Uvicorn | High-performance Python async routing with Swagger UI documentation |
| **Database** | SQLite, SQLAlchemy | Modular ORM setup with fallback config |
| **Analytics** | Pandas, Scikit-Learn | Time-series features (Rolling means, Lags) and Linear Regression models |
| **Process Control** | Concurrently | Single script monorepo orchestration |

---

## 🔑 Getting Started Locally

### Prerequisites
* **Node.js** (v18+)
* **Python** (v3.10+)

### 1. Repository Setup & Install Dependencies
Clone the repository and install root package orchestration utilities:
```bash
git clone https://github.com/KadirKh/DemandFlow-AI.git
cd DemandFlow-AI
npm install
```

### 2. Configure Python Backend & Database Seeding
Navigate to the backend app, initialize a virtual environment, and install libraries:
```bash
cd apps/backend
python -m venv venv
venv\Scripts\activate      # On Windows
source venv/bin/activate   # On macOS/Linux

# Install requirements (including Scikit-Learn, Pandas, FastAPI)
pip install -r requirements.txt
pip install email-validator # Required for credentials validation

# Run local database schema creation and mock data seeder
python -m app.utils.seed_data
```

This seeds:
1. **Users Registry**: Administrative, Planner, and Ops roles.
2. **Products Registry**: Detailed retail SKUs across Electronics, Clothing, and Home categories.
3. **Warehouses Master**: Geo-mapped distribution sites (Boston, Chicago, Oakland).
4. **Historical Demand**: 6 months of daily order logs with seasonality, promos, and trend characteristics.
5. **AI Forecast Engine**: Pre-calculated 30-day baseline time-series forecasts.

### 3. Configure Frontend Web Dependencies
Navigate to the web dashboard directory and install package requirements:
```bash
cd ../web
npm install
```

### 4. Run Both Servers Concurrently
Run the development monorepo start command from the project root:
```bash
cd ../../
npm run dev
```

* **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔐 Credentials for Local Login

Access the secure planner dashboard using any of these roles:

| Role | Username / Email | Password |
| :--- | :--- | :--- |
| **Supply Chain Planner** | `planner@demandflow.ai` | `plannerpassword` |
| **Operations Manager** | `ops@demandflow.ai` | `opspassword` |
| **Administrator** | `admin@demandflow.ai` | `adminpassword` |

---

## 📅 Roadmap

### Phase 1 – MVP 🚀 (Complete)
* Monorepo directory scaffold with Next.js App Router and FastAPI.
* SQLite Database schema modeling and comprehensive data seeder.
* Baseline Linear Regression engine calculating 30-day predictions with confidence interval bounds.
* Interactive Material Design 3 Web Console.

### Phase 2 – Inventory Intelligence 🧠 (Complete)
* Safety Stock & Reorder Point (ROP) calculation formulas.
* Interactive inventory grid highlighting stockout and low-stock alerts.
* Opportunity-Scored Decision inbox to approve or reject replenishment suggestions.

### Phase 3 – Logistics Optimization 🚚 (Planned)
* Dijkstra pathfinding algorithms for multi-point freight shipping lanes.
* Carbon-footprint tracking per transfer lane.

### Phase 4 – Real-Time Streaming 📡 (Planned)
* Apache Kafka event streaming to feed live order updates and immediate stock level refreshes.
* Redis caching layers for quick dashboard KPI queries.

### Phase 5 – Autonomous AI Agents 🤖 (Planned)
* Reinforcement Learning (RL) agents for automated warehouse balancing.
* Agentic tool calls to automatically execute restock lane balances upon approval.
