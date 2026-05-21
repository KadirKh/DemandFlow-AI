import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Product, Inventory, Warehouse, Order, Forecast
from ..services.inventory_logic import calculate_sku_inventory_metrics
from ..services.forecaster import train_and_forecast_sku

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("")
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    result = []
    for p in products:
        # Aggregate total stock across all warehouses
        total_stock = db.query(Inventory).filter(Inventory.product_id == p.id).with_entities(
            Inventory.on_hand, Inventory.reserved
        ).all()
        on_hand_sum = sum(x[0] for x in total_stock)
        reserved_sum = sum(x[1] for x in total_stock)
        
        result.append({
            "id": p.id,
            "sku_code": p.sku_code,
            "name": p.name,
            "category": p.category,
            "unit_cost": p.unit_cost,
            "total_on_hand": on_hand_sum,
            "total_reserved": reserved_sum
        })
    return result

@router.get("/{sku_code}")
def get_product_details(sku_code: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.sku_code == sku_code).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Get inventory states per warehouse
    warehouses = db.query(Warehouse).all()
    inventory_states = []
    
    for wh in warehouses:
        inv = db.query(Inventory).filter(
            Inventory.product_id == product.id,
            Inventory.warehouse_id == wh.id
        ).first()
        
        metrics = calculate_sku_inventory_metrics(db, product.id, wh.id)
        
        inventory_states.append({
            "warehouse_id": wh.id,
            "warehouse_name": wh.name,
            "city": wh.city,
            "on_hand": inv.on_hand if inv else 0,
            "reserved": inv.reserved if inv else 0,
            "safety_stock": metrics["safety_stock"],
            "reorder_point": metrics["reorder_point"],
            "days_of_cover": metrics["days_of_cover"],
            "status": metrics["status"]
        })
        
    # Get historical sales (past 60 days)
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=60)
    sales = db.query(Order).filter(
        Order.product_id == product.id,
        Order.order_date >= cutoff
    ).order_by(Order.order_date).all()
    
    sales_history = []
    for s in sales:
        # Group by date for frontend simplified charting
        sales_history.append({
            "date": s.order_date.strftime("%Y-%m-%d"),
            "quantity": s.quantity,
            "warehouse_id": s.warehouse_id
        })
        
    # Get forecasts (next 30 days)
    forecasts = db.query(Forecast).filter(
        Forecast.product_id == product.id
    ).order_by(Forecast.forecast_date).all()
    
    forecast_data = []
    for f in forecasts:
        forecast_data.append({
            "date": f.forecast_date.strftime("%Y-%m-%d"),
            "units": f.units,
            "confidence_lower": f.confidence_lower,
            "confidence_upper": f.confidence_upper,
            "warehouse_id": f.warehouse_id,
            "model_version": f.model_version
        })
        
    return {
        "product": {
            "id": product.id,
            "sku_code": product.sku_code,
            "name": product.name,
            "category": product.category,
            "unit_cost": product.unit_cost
        },
        "inventory": inventory_states,
        "sales_history": sales_history,
        "forecasts": forecast_data
    }

@router.post("/{sku_code}/forecast")
def retrain_and_generate_forecast(sku_code: str, warehouse_id: int = Query(...), db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.sku_code == sku_code).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Generate new forecasts
    forecast_records = train_and_forecast_sku(db, product.id, warehouse_id, horizon=30)
    
    # Remove existing forecasts for this sku & warehouse
    db.query(Forecast).filter(
        Forecast.product_id == product.id,
        Forecast.warehouse_id == warehouse_id
    ).delete()
    
    # Save new forecasts
    for rec in forecast_records:
        f = Forecast(**rec)
        db.add(f)
        
    db.commit()
    
    return {"status": "success", "message": f"Generated 30-day forecast for SKU {sku_code} at warehouse {warehouse_id}"}
