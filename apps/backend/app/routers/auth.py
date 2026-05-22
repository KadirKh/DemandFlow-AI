from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from ..database import get_db
from ..models import User, MarketData, InventoryData
from ..security import create_access_token, get_current_user
from ..services.predictor import run_predictions

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    role: str = "manufacturer"
    seed: bool = True

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        allowed_roles = {"manufacturer", "distributor"}
        if v not in allowed_roles:
            raise ValueError("Invalid role")
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    status: str

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint - returns JWT token"""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    # Generate real JWT token
    token_data = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user, restore their default workspace data, and return JWT token"""
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    hashed_password = pwd_context.hash(request.password)
    user = User(
        email=request.email,
        hashed_password=hashed_password,
        role=request.role or "manufacturer",
        status="active"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if request.seed:
        # RESTORE DATA: Seed default Manufacturer-Distributor coordination records for this new user
        default_market = [
            MarketData(
                user_id=user.id,
                product_id="SKU-999",
                factory_production_metrics=100.0,
                local_retail_sales=50.0,
                pending_shopkeeper_orders=20.0
            ),
            MarketData(
                user_id=user.id,
                product_id="SKU-888",
                factory_production_metrics=20.0,
                local_retail_sales=5.0,
                pending_shopkeeper_orders=2.0
            ),
            MarketData(
                user_id=user.id,
                product_id="SKU-777",
                factory_production_metrics=90.0,
                local_retail_sales=4.0,  # High rejection rate warning trigger (Rule E)
                pending_shopkeeper_orders=5.0
            )
        ]

        default_inventory = [
            InventoryData(
                user_id=user.id,
                product_id="SKU-999",
                warehouse_location="Manufacturer Warehouse Alpha",
                current_inventory_counts=120.0
            ),
            InventoryData(
                user_id=user.id,
                product_id="SKU-999",
                warehouse_location="Distributor Depot Beta",
                current_inventory_counts=95.0  # Overstocked (>80% unsold) -> Triggers Hold Production (Rule A)
            ),
            InventoryData(
                user_id=user.id,
                product_id="SKU-888",
                warehouse_location="Manufacturer Warehouse Alpha",
                current_inventory_counts=150.0
            ),
            InventoryData(
                user_id=user.id,
                product_id="SKU-888",
                warehouse_location="Distributor Depot Beta",
                current_inventory_counts=22.0  # Low inventory (<=30% capacity) -> Triggers Resume Production (Rule B)
            ),
            InventoryData(
                user_id=user.id,
                product_id="SKU-777",
                warehouse_location="Manufacturer Warehouse Alpha",
                current_inventory_counts=40.0
            ),
            InventoryData(
                user_id=user.id,
                product_id="SKU-777",
                warehouse_location="Distributor Depot Beta",
                current_inventory_counts=5.0  # Low inventory + High rejection rate
            )
        ]

        db.add_all(default_market)
        db.add_all(default_inventory)
        db.commit()

        # Pre-calculate predictive recommendations immediately using AI rules engine
        run_predictions(db, user.id)

    token_data = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role
    }
    access_token = create_access_token(data=token_data)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(user_info=Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user info - requires JWT token in Authorization header"""
    user = db.query(User).filter(User.id == user_info["user_id"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    return user

@router.get("/check-data-status")
def check_data_status(user_info=Depends(get_current_user), db: Session = Depends(get_db)):
    """Check if the authenticated user has uploaded market_data or inventory_data"""
    user_id = user_info["user_id"]
    has_market = db.query(MarketData).filter(MarketData.user_id == user_id).first() is not None
    has_inventory = db.query(InventoryData).filter(InventoryData.user_id == user_id).first() is not None
    return {"has_data": has_market or has_inventory}

