from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from ..database import get_db
from ..models import User
from ..security import create_access_token, get_current_user

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    role: str = "manufacturer"

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
    """Register a new user and return JWT token"""
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
