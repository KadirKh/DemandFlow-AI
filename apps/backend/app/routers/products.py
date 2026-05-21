import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Product, Inventory, Warehouse, Order, Forecast
from ..services.inventory_logic import calculate_sku_inventory_metrics
from ..services.forecaster import train_and_forecast_sku
from ..security import get_current_user
from ..logging_config import setup_logger

logger = setup_logger(__name__)

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("")
def list_products(
    _user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all products with aggregated inventory"""
    try:
        logger.debug("Fetching all products")
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
        logger.info(f"Successfully retrieved {len(result)} products")
        return result
    except Exception as e:
        logger.error(f"Error listing products: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve products"
        )

@router.get("/{sku_code}")
def get_product_details(
    sku_code: str,
    _user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get product details with inventory, sales history, and forecasts"""
    try:
        # Validate sku_code
        if not sku_code or not isinstance(sku_code, str) or len(sku_code.strip()) == 0:
            logger.warning(f"Invalid SKU code provided: {sku_code}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU code cannot be empty"
            )
        
        logger.debug(f"Fetching details for SKU: {sku_code}")
        product = db.query(Product).filter(Product.sku_code == sku_code).first()
        if not product:
            logger.warning(f"Product not found for SKU: {sku_code}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with SKU '{sku_code}' not found"
            )
        
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
            
        logger.info(f"Successfully retrieved details for SKU {sku_code}")
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
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Error fetching product details for SKU {sku_code}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve product details"
        )

@router.post("/{sku_code}/forecast")
def retrain_and_generate_forecast(
    sku_code: str,
    warehouse_id: int = Query(...),
    _user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrain ML model and generate 30-day forecast for a product at a warehouse"""
    try:
        # Validate inputs
        if not sku_code or not isinstance(sku_code, str) or len(sku_code.strip()) == 0:
            logger.warning(f"Invalid SKU code provided: {sku_code}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU code cannot be empty"
            )
        
        if warehouse_id <= 0:
            logger.warning(f"Invalid warehouse_id: {warehouse_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Warehouse ID must be a positive integer"
            )
        
        logger.debug(f"Retraining forecast for SKU {sku_code} at warehouse {warehouse_id}")
        product = db.query(Product).filter(Product.sku_code == sku_code).first()
        if not product:
            logger.warning(f"Product not found for SKU: {sku_code}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with SKU '{sku_code}' not found"
            )
        
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
        logger.info(f"Successfully generated forecast for SKU {sku_code} at warehouse {warehouse_id}")
        
        return {
            "status": "success",
            "message": f"Generated 30-day forecast for SKU {sku_code} at warehouse {warehouse_id}"
        }
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Error retraining forecast for SKU {sku_code}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate forecast"
        )
