import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from ..models import Inventory, Order, Product, Warehouse, Forecast, Supplier, Recommendation

def calculate_sku_inventory_metrics(db: Session, product_id: int, warehouse_id: int, service_level: float = 0.95) -> dict:
    """
    Computes Safety Stock, Reorder Point, and Days of Cover for a SKU at a warehouse
    using historical demand statistics and supplier lead times.
    """
    # Z-score for service levels (standard normal distribution)
    # 90% -> 1.28, 95% -> 1.65, 99% -> 2.33
    z_scores = {0.90: 1.28, 0.95: 1.65, 0.99: 2.33}
    z = z_scores.get(service_level, 1.65)
    
    # 1. Fetch historical daily demand
    orders = db.query(Order).filter(
        Order.product_id == product_id,
        Order.warehouse_id == warehouse_id
    ).all()
    
    if not orders:
        return {
            "avg_daily_demand": 5.0,
            "demand_std_dev": 2.0,
            "safety_stock": 10,
            "reorder_point": 25,
            "days_of_cover": 10.0,
            "status": "normal"
        }

    # Group by date to get daily demand
    df = pd.DataFrame([{"date": o.order_date.date(), "qty": o.quantity} for o in orders])
    daily_demand = df.groupby("date")["qty"].sum()
    
    avg_daily_demand = float(daily_demand.mean())
    demand_std_dev = float(daily_demand.std()) if len(daily_demand) > 1 else 1.0
    
    # 2. Get Supplier lead times
    product = db.query(Product).filter(Product.id == product_id).first()
    # Mock supplier lookup based on category/id matching
    supplier = db.query(Supplier).first()
    lead_time_days = supplier.lead_time_days if supplier else 7
    lead_time_std_dev = 1.5 # standard deviation of delivery times
    
    # 3. Apply Safety Stock Formula
    # Safety Stock = Z * sqrt( (LeadTime * Demand_StdDev^2) + (AvgDailyDemand^2 * LeadTime_StdDev^2) )
    safety_stock = z * np.sqrt(
        (lead_time_days * (demand_std_dev ** 2)) + 
        ((avg_daily_demand ** 2) * (lead_time_std_dev ** 2))
    )
    safety_stock = int(np.ceil(safety_stock))
    
    # 4. Reorder Point (ROP) Formula
    # ROP = (AvgDailyDemand * LeadTime) + SafetyStock
    reorder_point = int(np.ceil((avg_daily_demand * lead_time_days) + safety_stock))
    
    # 5. Fetch current inventory levels
    inv = db.query(Inventory).filter(
        Inventory.product_id == product_id,
        Inventory.warehouse_id == warehouse_id
    ).first()
    on_hand = inv.on_hand if inv else 0
    
    # Days of Cover
    days_of_cover = on_hand / max(avg_daily_demand, 0.1)
    
    # Determine status
    if on_hand == 0:
        status = "out_of_stock"
    elif on_hand < safety_stock:
        status = "critical"
    elif on_hand < reorder_point:
        status = "low_stock"
    elif on_hand > reorder_point * 2.5:
        status = "overstocked"
    else:
        status = "healthy"
        
    return {
        "avg_daily_demand": float(round(avg_daily_demand, 2)),
        "demand_std_dev": float(round(demand_std_dev, 2)),
        "safety_stock": safety_stock,
        "reorder_point": reorder_point,
        "days_of_cover": float(round(days_of_cover, 1)),
        "status": status
    }

def generate_warehouse_transfer_recommendations(db: Session) -> list:
    """
    Scans warehouses for high-stock and low-stock instances of the same SKUs,
    generating recommendations to balance stock across sites.
    """
    products = db.query(Product).all()
    warehouses = db.query(Warehouse).all()
    recommendations = []
    
    for prod in products:
        warehouse_states = []
        for wh in warehouses:
            metrics = calculate_sku_inventory_metrics(db, prod.id, wh.id)
            inv = db.query(Inventory).filter(
                Inventory.product_id == prod.id,
                Inventory.warehouse_id == wh.id
            ).first()
            on_hand = inv.on_hand if inv else 0
            
            warehouse_states.append({
                "warehouse_id": wh.id,
                "warehouse_name": wh.name,
                "on_hand": on_hand,
                "safety_stock": metrics["safety_stock"],
                "reorder_point": metrics["reorder_point"],
                "status": metrics["status"]
            })
            
        # Look for combinations of overstocked/healthy and low/critical
        sources = [ws for ws in warehouse_states if ws["status"] in ["overstocked", "healthy"] and ws["on_hand"] > ws["reorder_point"]]
        targets = [ws for ws in warehouse_states if ws["status"] in ["low_stock", "critical", "out_of_stock"]]
        
        for src in sources:
            for tgt in targets:
                # Calculate maximum safe units to transfer
                surplus = src["on_hand"] - src["reorder_point"]
                deficit = tgt["reorder_point"] - tgt["on_hand"]
                transfer_qty = min(surplus, deficit)
                
                if transfer_qty >= 5: # Only suggest if substantial
                    score = 0.85 if tgt["status"] == "out_of_stock" else 0.70
                    explanation = f"Transfer {transfer_qty} units of SKU {prod.sku_code} from {src['warehouse_name']} to {tgt['warehouse_name']} to resolve stock deficit and optimize regional distribution."
                    
                    # Create recommendation record data structure
                    rec = Recommendation(
                        type="transfer",
                        entity_id=f"{prod.sku_code}:{src['warehouse_id']}:{tgt['warehouse_id']}",
                        score=score,
                        explanation=explanation,
                        action_status="pending"
                    )
                    recommendations.append(rec)
                    
    return recommendations
