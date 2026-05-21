import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="manufacturer")  # admin, manufacturer, distributor
    status = Column(String, default="active")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    unit_cost = Column(Float, nullable=False)

    inventory = relationship("Inventory", back_populates="product", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="product", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="product", cascade="all, delete-orphan")

class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    capacity = Column(Integer, nullable=False)
    geo_lat = Column(Float, nullable=False)
    geo_lng = Column(Float, nullable=False)

    inventory = relationship("Inventory", back_populates="warehouse", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="warehouse", cascade="all, delete-orphan")
    forecasts = relationship("Forecast", back_populates="warehouse", cascade="all, delete-orphan")

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    on_hand = Column(Integer, default=0)
    reserved = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="inventory")
    warehouse = relationship("Warehouse", back_populates="inventory")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    order_date = Column(DateTime, nullable=False)
    promised_date = Column(DateTime, nullable=True)
    status = Column(String, default="pending")  # pending, shipped, delivered, cancelled

    product = relationship("Product", back_populates="orders")
    warehouse = relationship("Warehouse", back_populates="orders")

class Forecast(Base):
    __tablename__ = "forecasts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    forecast_date = Column(DateTime, nullable=False)
    horizon = Column(Integer, nullable=False)  # 1 to 30 days
    units = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=True)
    confidence_upper = Column(Float, nullable=True)
    model_version = Column(String, nullable=False)

    product = relationship("Product", back_populates="forecasts")
    warehouse = relationship("Warehouse", back_populates="forecasts")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String, unique=True, index=True, nullable=False)
    lead_time_days = Column(Integer, default=7)
    reliability_score = Column(Float, default=1.0)  # 0.0 to 1.0

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # restock, transfer, hold, switch_supplier
    entity_id = Column(String, nullable=False)  # Product SKU or ID combination
    score = Column(Float, nullable=False)  # Recommendation score/confidence
    explanation = Column(String, nullable=False)
    action_status = Column(String, default="pending")  # pending, approved, rejected, ignored
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
