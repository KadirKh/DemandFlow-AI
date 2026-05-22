import sys
import os

# Add backend app directory to path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'apps', 'backend'))
sys.path.append(backend_path)

from app.database import engine, Base
# Import all models to register them on Base
from app.models import User, Product, Warehouse, Inventory, Order, Forecast, Supplier, Recommendation, MarketData, InventoryData

print("Dropping all tables in SQLite database...")
Base.metadata.drop_all(bind=engine)
print("Recreating all tables in SQLite database with updated schema...")
Base.metadata.create_all(bind=engine)
print("Database schema successfully reset!")
