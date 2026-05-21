import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, dashboard, products, recommendations

# Create tables automatically on startup (especially useful for SQLite)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DemandFlow-AI Core API",
    description="API engine for demand forecasting, inventory optimization, and supply chain recommendations.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(products.router)
app.include_router(recommendations.router)

@app.get("/")
def read_root():
    return {"message": "DemandFlow-AI API is active."}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}
