import datetime
from sqlalchemy.orm import Session
from ..models import MarketData, InventoryData, Recommendation
from ..logging_config import setup_logger

logger = setup_logger(__name__)

def run_predictions(db: Session, user_id: int):
    """
    Runs the AI Rules Engine for a given user.
    Loads MarketData and InventoryData, applies formulas,
    generates Recommendations, and saves them to the DB.
    """
    logger.info(f"Running predictor for user {user_id}")
    
    # 1. Fetch data
    market_records = db.query(MarketData).filter(MarketData.user_id == user_id).all()
    inventory_records = db.query(InventoryData).filter(InventoryData.user_id == user_id).all()
    
    if not market_records or not inventory_records:
        logger.warning(f"Insufficient data to run predictor for user {user_id}")
        return []
        
    # Group inventory by product
    inventory_by_product = {}
    for inv in inventory_records:
        prod_id = inv.product_id
        if prod_id not in inventory_by_product:
            inventory_by_product[prod_id] = []
        inventory_by_product[prod_id].append(inv)
        
    # Group market records by product (normally 1 per product)
    market_by_product = {}
    for m in market_records:
        prod_id = m.product_id
        market_by_product[prod_id] = m

    # Deactivate existing active recommendations for this user before generating new ones
    db.query(Recommendation).filter(
        Recommendation.user_id == user_id,
        Recommendation.active == True
    ).update({Recommendation.active: False}, synchronize_session=False)
    db.commit()

    generated_recommendations = []

    # Get union of all product IDs
    product_ids = set(market_by_product.keys()) | set(inventory_by_product.keys())

    for pid in product_ids:
        market_item = market_by_product.get(pid)
        product_inventory = inventory_by_product.get(pid, [])
        
        # Gather metrics
        retail_sales = market_item.local_retail_sales if market_item else 0.0
        pending_orders = market_item.pending_shopkeeper_orders if market_item else 0.0
        factory_production_metrics = market_item.factory_production_metrics if market_item else 0.0
        total_inventory = sum(inv.current_inventory_counts for inv in product_inventory)
        
        # Determine manufacturer vs distributor stock
        manufacturer_stock = 0.0
        distributor_stock = 0.0
        
        for inv in product_inventory:
            loc = inv.warehouse_location.lower()
            if "distributor" in loc or "beta" in loc or "depot" in loc:
                distributor_stock += inv.current_inventory_counts
            else:
                manufacturer_stock += inv.current_inventory_counts
                
        # 1. AI Math & Rules Logic
        total_local_demand = retail_sales + pending_orders
        net_position_balance = total_local_demand - total_inventory
        
        logger.debug(f"Product {pid}: Demand={total_local_demand}, Inventory={total_inventory}, Manufacturer Stock={manufacturer_stock}, Distributor Stock={distributor_stock}")
        
        # 2. Evaluate rules and generate cards
        
        # Check Spatial Anomalies (Regional Mismatch) first to see if we have inventory distribution issues
        has_spatial_anomaly = False
        if len(product_inventory) > 1:
            counts = [inv.current_inventory_counts for inv in product_inventory]
            max_inv = max(counts)
            min_inv = min(counts)
            # If one warehouse has stock out / critical low and another has a surplus
            if min_inv <= 5 and max_inv >= 30:
                has_spatial_anomaly = True
        # Determine if we have any distributor warehouse in the product inventory list
        has_distributor = any(
            ("distributor" in inv.warehouse_location.lower() or 
             "beta" in inv.warehouse_location.lower() or 
             "depot" in inv.warehouse_location.lower())
            for inv in product_inventory
        )

        # Rule A: Distributor is overstocked (>80% of stock capacity, e.g. >= 80 units) -> Hold Production to save money & reduce burden
        if has_distributor and distributor_stock >= 80.0:
            rec_type = "balanced_stock"
            score = 0.95
            explanation = f"HOLD PRODUCTION: Distributor has high stock level ({int(distributor_stock)} units, >80% unsold) for SKU {pid}. Manufacturer holds production to avoid over-allocation, saving money and reducing gas/energy burn."
            
            rec = Recommendation(
                user_id=user_id,
                type=rec_type,
                entity_id=pid,
                score=score,
                explanation=explanation,
                action_status="pending",
                active=True
            )
            db.add(rec)
            generated_recommendations.append(rec)

        # Rule B: Distributor inventory is low (<=30% capacity, e.g. <= 30 units) -> Resume Production to maintain product flow
        elif has_distributor and distributor_stock <= 30.0:
            rec_type = "production_deficit"
            score = round(min(1.0, (100.0 - distributor_stock) / 100.0), 2)
            explanation = f"RESUME PRODUCTION: Distributor stock is low ({int(distributor_stock)} units remaining, >=70% sold) for SKU {pid}. Manufacturer resumes production to sustain active supply flow with minimal holding burden."
            
            rec = Recommendation(
                user_id=user_id,
                type=rec_type,
                entity_id=pid,
                score=score,
                explanation=explanation,
                action_status="pending",
                active=True
            )
            db.add(rec)
            generated_recommendations.append(rec)

        # Rule C: Fallback Net Position Balance
        else:
            if net_position_balance > 0:
                rec_type = "production_deficit"
                score = round(min(1.0, net_position_balance / max(1.0, total_local_demand)), 2)
                explanation = f"ALERT: PRODUCTION DEFICIT. Total Local Demand ({int(total_local_demand)} units) exceeds inventory ({int(total_inventory)} units) for SKU {pid}. Action: Resume Production by 15%."
            else:
                rec_type = "balanced_stock"
                score = 1.0
                explanation = f"ALERT: Balanced Stock. Total Local Demand ({int(total_local_demand)} units) is fully covered by on-hand inventory ({int(total_inventory)} units) for SKU {pid}. Action: Hold Production."
            
            rec = Recommendation(
                user_id=user_id,
                type=rec_type,
                entity_id=pid,
                score=score,
                explanation=explanation,
                action_status="pending",
                active=True
            )
            db.add(rec)
            generated_recommendations.append(rec)

        # Rule D: Spatial stock anomalies or regional mismatch
        if has_spatial_anomaly:
            # Recommend moving stock from max inventory warehouse to min inventory warehouse
            wh_max = max(product_inventory, key=lambda x: x.current_inventory_counts)
            wh_min = min(product_inventory, key=lambda x: x.current_inventory_counts)
            
            rec_type = "regional_mismatch"
            score = 0.85
            explanation = f"ALERT: Regional Mismatch. SKU {pid} is imbalanced. Location '{wh_min.warehouse_location}' has only {int(wh_min.current_inventory_counts)} units, while '{wh_max.warehouse_location}' has {int(wh_max.current_inventory_counts)} units. Action: Rebalance Inventory (Transfer from {wh_max.warehouse_location} to {wh_min.warehouse_location})."
            
            rec = Recommendation(
                user_id=user_id,
                type=rec_type,
                entity_id=pid,
                score=score,
                explanation=explanation,
                action_status="pending_review",  # Load into column 2 ("undergoing structural review")
                active=True
            )
            db.add(rec)
            generated_recommendations.append(rec)

        # Rule E: Quality / Rejection Alert (If production is high but retail sales are less than 10%)
        if factory_production_metrics > 50.0 and retail_sales > 0 and (retail_sales / factory_production_metrics) < 0.1:
            rec_type = "regional_mismatch" # Gray/amber style for warning
            score = 0.90
            explanation = f"QUALITY ALERT: SKU {pid} shows high rejection rate. Production is high ({int(factory_production_metrics)} units) but retail sales are very low ({int(retail_sales)} units), suggesting quality issues or poor reviews. Review quality control parameters."
            
            rec = Recommendation(
                user_id=user_id,
                type=rec_type,
                entity_id=pid,
                score=score,
                explanation=explanation,
                action_status="pending_review",
                active=True
            )
            db.add(rec)
            generated_recommendations.append(rec)

    db.commit()
    logger.info(f"Generated {len(generated_recommendations)} recommendations for user {user_id}")
    return generated_recommendations
