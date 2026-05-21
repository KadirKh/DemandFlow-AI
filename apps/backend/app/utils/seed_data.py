import datetime
import random
import numpy as np
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from ..database import engine, Base, SessionLocal
from ..models import User, Product, Warehouse, Inventory, Order, Forecast, Supplier, Recommendation

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def seed_db():
    db = SessionLocal()
    try:
        # Recreate tables
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        
        print("Database schemas created.")
        
        # 1. Users
        users = [
            User(email="admin@demandflow.ai", hashed_password=pwd_context.hash("adminpassword"), role="admin"),
            User(email="planner@demandflow.ai", hashed_password=pwd_context.hash("plannerpassword"), role="planner"),
            User(email="ops@demandflow.ai", hashed_password=pwd_context.hash("opspassword"), role="warehouse_manager")
        ]
        db.add_all(users)
        
        # 2. Suppliers
        suppliers = [
            Supplier(supplier_name="Alpha Distribution", lead_time_days=5, reliability_score=0.96),
            Supplier(supplier_name="Global Tech Imports", lead_time_days=12, reliability_score=0.88),
            Supplier(supplier_name="Pacific Apparel", lead_time_days=7, reliability_score=0.92)
        ]
        db.add_all(suppliers)
        
        # 3. Products
        products = [
            Product(sku_code="DF-ELEC-001", name="Pro Laptop Charger 90W", category="Electronics", unit_cost=25.0),
            Product(sku_code="DF-ELEC-002", name="Tactile Mechanical Keyboard", category="Electronics", unit_cost=85.0),
            Product(sku_code="DF-CLOT-001", name="Heavyweight Fleece Hoodie", category="Clothing", unit_cost=45.0),
            Product(sku_code="DF-CLOT-002", name="Classic Cargo Pants", category="Clothing", unit_cost=35.0),
            Product(sku_code="DF-HOME-001", name="Smart LED Desk Lamp", category="Home Goods", unit_cost=30.0),
            Product(sku_code="DF-HOME-002", name="Ergonomic Lumbar Cushion", category="Home Goods", unit_cost=40.0)
        ]
        db.add_all(products)
        
        # 4. Warehouses
        warehouses = [
            Warehouse(name="Main East Hub", city="Boston", capacity=10000, geo_lat=42.3601, geo_lng=-71.0589),
            Warehouse(name="Central Logistics Center", city="Chicago", capacity=15000, geo_lat=41.8781, geo_lng=-87.6298),
            Warehouse(name="West Coast Depot", city="Oakland", capacity=12000, geo_lat=37.8044, geo_lng=-122.2712)
        ]
        db.add_all(warehouses)
        
        db.commit() # Commit parents to get IDs
        
        print("Base products, warehouses, and suppliers seeded.")
        
        # Fetch seeded IDs
        db_products = db.query(Product).all()
        db_warehouses = db.query(Warehouse).all()
        
        # 5. Inventory & Orders seeding
        start_date = datetime.datetime.utcnow() - datetime.timedelta(days=180) # 6 months history
        end_date = datetime.datetime.utcnow()
        
        print("Generating historical sales (orders) and stock snapshots. This may take a moment...")
        
        for p in db_products:
            for w in db_warehouses:
                # Set initial stock levels
                # Create some variance: some low, some high, some normal
                base_qty = 200 if p.category == "Electronics" else 150
                stock_variance = random.choice([0.4, 0.9, 1.5, 0.1])
                on_hand = int(base_qty * stock_variance)
                reserved = int(on_hand * 0.1)
                
                inv = Inventory(
                    product_id=p.id,
                    warehouse_id=w.id,
                    on_hand=on_hand,
                    reserved=reserved
                )
                db.add(inv)
                
                # Generate historical daily demand (Orders)
                current_day = start_date
                # Define SKU demand characteristics
                base_demand = 12 if p.category == "Electronics" else 8
                if w.city == "Chicago":
                    base_demand *= 1.4 # Higher volume warehouse
                
                # Add weekly seasonality and promotions
                while current_day <= end_date:
                    day_of_week = current_day.weekday()
                    
                    # Weekly seasonality factor (higher sales on weekends: Friday=4, Saturday=5)
                    season_factor = 1.3 if day_of_week in [4, 5] else 0.9
                    
                    # Trend factor (moderate growth)
                    days_elapsed = (current_day - start_date).days
                    trend_factor = 1.0 + (days_elapsed / 365.0) * 0.2
                    
                    # Promo triggers (about 5% chance of promo)
                    promo = 1.6 if random.random() < 0.05 else 1.0
                    
                    # Noise
                    noise = np.random.normal(0, base_demand * 0.15)
                    
                    # Calculate quantity
                    qty = int(max(0, (base_demand * season_factor * trend_factor * promo) + noise))
                    
                    # Let's seed an order
                    order = Order(
                        product_id=p.id,
                        warehouse_id=w.id,
                        quantity=qty,
                        order_date=current_day,
                        promised_date=current_day + datetime.timedelta(days=2),
                        status="delivered" if current_day < end_date - datetime.timedelta(days=2) else "pending"
                    )
                    db.add(order)
                    current_day += datetime.timedelta(days=1)
                    
        db.commit()
        print("Inventory records and historical orders seeded.")
        
        # 6. Pre-generate Forecasts
        print("Generating baseline forecasts...")
        from ..services.forecaster import train_and_forecast_sku
        
        for p in db_products:
            for w in db_warehouses:
                forecast_records = train_and_forecast_sku(db, p.id, w.id, horizon=30)
                for rec in forecast_records:
                    forecast = Forecast(**rec)
                    db.add(forecast)
                    
        db.commit()
        print("Forecasts seeded.")
        
        # 7. Pre-generate Recommendations & Alerts
        print("Seeding alerts and recommendations...")
        # Restock recommendations
        recs = [
            Recommendation(
                type="restock",
                entity_id="DF-ELEC-001",
                score=0.92,
                explanation="SKU DF-ELEC-001 (Pro Laptop Charger 90W) is approaching critical safety stock levels at Central Logistics Center. Recommended restock order of 120 units from Alpha Distribution.",
                action_status="pending"
            ),
            Recommendation(
                type="restock",
                entity_id="DF-CLOT-001",
                score=0.88,
                explanation="SKU DF-CLOT-001 (Heavyweight Fleece Hoodie) projected stockouts in 6 days at West Coast Depot. Recommended procurement of 80 units from Pacific Apparel.",
                action_status="pending"
            ),
            Recommendation(
                type="hold",
                entity_id="DF-HOME-001",
                score=0.74,
                explanation="SKU DF-HOME-001 (Smart LED Desk Lamp) shows declining trend in forecasted demand (-18% over next 14 days). Recommended holding restock orders at Main East Hub to prevent overstocking.",
                action_status="pending"
            )
        ]
        db.add_all(recs)
        
        # Add warehouse transfers recommendations
        from ..services.inventory_logic import generate_warehouse_transfer_recommendations
        transfer_recs = generate_warehouse_transfer_recommendations(db)
        db.add_all(transfer_recs)
        
        db.commit()
        print("Recommendations seeded successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
