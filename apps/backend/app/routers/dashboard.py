import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import Order, Forecast, Inventory, Recommendation, Product, Warehouse
from ..services.inventory_logic import calculate_sku_inventory_metrics

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("")
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Date ranges
    now = datetime.datetime.utcnow()
    thirty_days_ago = now - datetime.timedelta(days=30)
    thirty_days_future = now + datetime.timedelta(days=30)
    
    # 2. Total sales (past 30 days)
    total_sales_qty = db.query(func.sum(Order.quantity)).filter(
        Order.order_date >= thirty_days_ago,
        Order.order_date <= now
    ).scalar() or 0
    
    # 3. Total forecasted sales (next 30 days)
    total_forecast_qty = db.query(func.sum(Forecast.units)).filter(
        Forecast.forecast_date >= now,
        Forecast.forecast_date <= thirty_days_future
    ).scalar() or 0
    
    # 4. Count recommendations
    pending_recs = db.query(Recommendation).filter(
        Recommendation.action_status == "pending"
    ).count()
    
    # 5. Scan inventory for alerts
    inventories = db.query(Inventory).all()
    alerts = []
    total_items = 0
    stockout_count = 0
    low_stock_count = 0
    
    for inv in inventories:
        metrics = calculate_sku_inventory_metrics(db, inv.product_id, inv.warehouse_id)
        total_items += 1
        
        prod = db.query(Product).filter(Product.id == inv.product_id).first()
        wh = db.query(Warehouse).filter(Warehouse.id == inv.warehouse_id).first()
        
        if metrics["status"] == "out_of_stock":
            stockout_count += 1
            alerts.append({
                "type": "out_of_stock",
                "sku": prod.sku_code,
                "product_name": prod.name,
                "warehouse": wh.name,
                "on_hand": inv.on_hand,
                "reorder_point": metrics["reorder_point"],
                "severity": "high"
            })
        elif metrics["status"] in ["critical", "low_stock"]:
            low_stock_count += 1
            alerts.append({
                "type": "low_stock",
                "sku": prod.sku_code,
                "product_name": prod.name,
                "warehouse": wh.name,
                "on_hand": inv.on_hand,
                "reorder_point": metrics["reorder_point"],
                "severity": "medium" if metrics["status"] == "low_stock" else "high"
            })

    # Sort alerts by severity
    alerts = sorted(alerts, key=lambda x: x["severity"] == "high", reverse=True)[:10]

    # Calculate mock metrics
    fill_rate = 98.4
    forecast_accuracy = 91.2
    
    # 6. Aggregate historical sales vs forecast timeseries
    # Historical sales daily sum (last 30 days)
    hist_query = db.query(
        func.date(Order.order_date).label("date"),
        func.sum(Order.quantity).label("qty")
    ).filter(
        Order.order_date >= thirty_days_ago,
        Order.order_date <= now
    ).group_by(func.date(Order.order_date)).order_by("date").all()
    
    hist_series = [{"date": str(row.date), "actual": float(row.qty), "forecast": None} for row in hist_query]
    
    # Forecast daily sum (next 30 days)
    fc_query = db.query(
        func.date(Forecast.forecast_date).label("date"),
        func.sum(Forecast.units).label("qty")
    ).filter(
        Forecast.forecast_date >= now,
        Forecast.forecast_date <= thirty_days_future
    ).group_by(func.date(Forecast.forecast_date)).order_by("date").all()
    
    fc_series = [{"date": str(row.date), "actual": None, "forecast": float(round(row.qty, 1))} for row in fc_query]
    
    # Combine charts
    combined_chart = hist_series + fc_series
    
    return {
        "kpis": {
            "total_sales_30d": total_sales_qty,
            "total_forecast_30d": int(total_forecast_qty),
            "fill_rate": fill_rate,
            "forecast_accuracy": forecast_accuracy,
            "pending_recs": pending_recs,
            "stockout_count": stockout_count,
            "low_stock_count": low_stock_count
        },
        "alerts": alerts,
        "demand_trend": combined_chart
    }
