# DemandFlow AI - User Guide & Workflow Manual

Welcome to the DemandFlow AI platform. This manual walks you through the step-by-step operations required to ingest supply chain data, review demand forecasts, and manage stock replenishment rules.

## 1. Authentication

The login screen supports two methods of authentication:

1. **Standard Key Login**: Sign in using a manual User ID and Security Key.
2. **Secure Google Sign-In**: Click "Continue with Google" to launch the authentic Google Accounts authentication popup. Real-time manufacturer profiles are auto-registered upon successful email confirmation.

---

## 2. Ingesting Datasets

To feed the ML forecasting engine, you must upload two CSV/JSON datasets inside the **Ingest Datasets** dashboard tab:

### 1. Market Demand Dataset (CSV)
Contains historical sales figures and retail shopkeeper order cues.
- **Columns Required**: `product_id`, `factory_production_metrics`, `local_retail_sales`, `pending_shopkeeper_orders`

### 2. Inventory Levels Dataset (CSV)
Contains present warehouse geo-locations and inventory counts.
- **Columns Required**: `product_id`, `warehouse_location`, `current_inventory_counts`

---

## 3. Reviewing AI Predictions & acting on recommendations

Once datasets are ingested:
1. Click **Process & Analyze Datasets** to trigger the machine learning pipeline.
2. Navigate to the **AI Predictions Inbox**.
3. View simulated 7-day projection curves illustrating balanced safe limits (green line) versus depleted stockout zones (red line).
4. Select **Approve** to execute inventory balances, or **Reject** to dismiss the recommendations.
