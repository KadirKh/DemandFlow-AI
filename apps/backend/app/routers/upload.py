import io
import json
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import MarketData, InventoryData, Recommendation
from ..security import get_current_user
from ..services.predictor import run_predictions
from ..logging_config import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="/api/upload", tags=["upload"])

def find_column(df_columns, possible_names):
    """Helper to find column index matching possible aliases case-insensitively"""
    for col in df_columns:
        if col.lower().strip() in possible_names:
            return col
    return None

@router.post("/market-data")
async def upload_market_data(
    file: UploadFile = File(...),
    user_info=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and parse market data CSV/JSON"""
    user_id = user_info["user_id"]
    filename = file.filename.lower()
    
    try:
        content = await file.read()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            # Try parsing as JSON array
            try:
                data = json.loads(content.decode("utf-8"))
                if isinstance(data, dict) and "market_data" in data:
                    data = data["market_data"]
                df = pd.DataFrame(data)
            except Exception as je:
                logger.error(f"JSON load failed: {str(je)}")
                raise HTTPException(status_code=400, detail="Invalid JSON file format")
        else:
            raise HTTPException(status_code=400, detail="Only .csv and .json files are supported")
            
        # Standardize columns
        col_prod = find_column(df.columns, ["product_id", "product id", "sku", "sku_code", "productid"])
        col_prod_metrics = find_column(df.columns, ["factory_production_metrics", "factory production metrics", "production", "factory_production", "production_metrics"])
        col_retail_sales = find_column(df.columns, ["local_retail_sales", "local retail sales", "retail_sales", "sales", "local_sales"])
        col_pending_orders = find_column(df.columns, ["pending_shopkeeper_orders", "pending shopkeeper orders", "orders", "pending_orders", "shopkeeper_orders"])
        
        if not col_prod or not col_prod_metrics or not col_retail_sales or not col_pending_orders:
            missing = []
            if not col_prod: missing.append("Product ID")
            if not col_prod_metrics: missing.append("Factory Production Metrics")
            if not col_retail_sales: missing.append("Local Retail Sales")
            if not col_pending_orders: missing.append("Pending Shopkeeper Orders")
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns in market data: {', '.join(missing)}"
            )
            
        # Clear existing market data for this user
        db.query(MarketData).filter(MarketData.user_id == user_id).delete()
        
        # Save new market data
        inserted_count = 0
        for _, row in df.iterrows():
            market_row = MarketData(
                user_id=user_id,
                product_id=str(row[col_prod]).strip(),
                factory_production_metrics=float(row[col_prod_metrics]),
                local_retail_sales=float(row[col_retail_sales]),
                pending_shopkeeper_orders=float(row[col_pending_orders])
            )
            db.add(market_row)
            inserted_count += 1
            
        db.commit()
        logger.info(f"User {user_id} uploaded {inserted_count} market data rows")
        return {"status": "success", "rows_inserted": inserted_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing market data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse and save market data: {str(e)}"
        )

@router.post("/inventory-data")
async def upload_inventory_data(
    file: UploadFile = File(...),
    user_info=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and parse inventory data CSV/JSON"""
    user_id = user_info["user_id"]
    filename = file.filename.lower()
    
    try:
        content = await file.read()
        
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            try:
                data = json.loads(content.decode("utf-8"))
                if isinstance(data, dict) and "inventory_data" in data:
                    data = data["inventory_data"]
                df = pd.DataFrame(data)
            except Exception as je:
                logger.error(f"JSON load failed: {str(je)}")
                raise HTTPException(status_code=400, detail="Invalid JSON file format")
        else:
            raise HTTPException(status_code=400, detail="Only .csv and .json files are supported")
            
        # Standardize columns
        col_prod = find_column(df.columns, ["product_id", "product id", "sku", "sku_code", "productid"])
        col_wh_loc = find_column(df.columns, ["warehouse_location", "warehouse location", "warehouse", "location"])
        col_inv_counts = find_column(df.columns, ["current_inventory_counts", "current inventory counts", "inventory", "counts", "quantity", "on_hand", "current_inventory"])
        
        if not col_prod or not col_wh_loc or not col_inv_counts:
            missing = []
            if not col_prod: missing.append("Product ID")
            if not col_wh_loc: missing.append("Warehouse Location")
            if not col_inv_counts: missing.append("Current Inventory Counts")
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns in inventory data: {', '.join(missing)}"
            )
            
        # Clear existing inventory data for this user
        db.query(InventoryData).filter(InventoryData.user_id == user_id).delete()
        
        # Save new inventory data
        inserted_count = 0
        for _, row in df.iterrows():
            inventory_row = InventoryData(
                user_id=user_id,
                product_id=str(row[col_prod]).strip(),
                warehouse_location=str(row[col_wh_loc]).strip(),
                current_inventory_counts=float(row[col_inv_counts])
            )
            db.add(inventory_row)
            inserted_count += 1
            
        db.commit()
        logger.info(f"User {user_id} uploaded {inserted_count} inventory data rows")
        return {"status": "success", "rows_inserted": inserted_count}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error parsing inventory data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse and save inventory data: {str(e)}"
        )

@router.post("/process")
def process_uploaded_data(
    user_info=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run prediction engine over uploaded datasets"""
    user_id = user_info["user_id"]
    try:
        recs = run_predictions(db, user_id)
        return {
            "status": "success",
            "message": "AI prediction complete and recommendations saved.",
            "recommendations_generated": len(recs)
        }
    except Exception as e:
        logger.error(f"Prediction process failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process data and generate predictions: {str(e)}"
        )

@router.post("/clear")
def clear_data(
    user_info=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear uploaded datasets and generated recommendations for resetting"""
    user_id = user_info["user_id"]
    try:
        db.query(MarketData).filter(MarketData.user_id == user_id).delete()
        db.query(InventoryData).filter(InventoryData.user_id == user_id).delete()
        db.query(Recommendation).filter(Recommendation.user_id == user_id).delete()
        db.commit()
        return {"status": "success", "message": "All data cleared successfully."}
    except Exception as e:
        logger.error(f"Failed to clear data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear user data: {str(e)}"
        )
