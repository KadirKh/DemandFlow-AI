from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models import Recommendation, Inventory, Product

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

class ActionRequest(BaseModel):
    action: str  # approved, rejected

@router.get("")
def list_recommendations(db: Session = Depends(get_db)):
    # Returns recommendations sorted by score (highest confidence/impact first)
    recs = db.query(Recommendation).order_by(Recommendation.score.desc()).all()
    return recs

@router.post("/{rec_id}/action")
def update_recommendation_status(rec_id: int, request: ActionRequest, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    if request.action not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action, must be 'approved' or 'rejected'")
        
    rec.action_status = request.action
    
    # If recommendation is approved, mock updating the inventory (for presentation purposes)
    if request.action == "approved" and rec.type == "transfer":
        try:
            # entity_id is formatted as: "sku:source_wh_id:target_wh_id"
            parts = rec.entity_id.split(":")
            if len(parts) == 3:
                sku, src_id, tgt_id = parts
                src_id = int(src_id)
                tgt_id = int(tgt_id)
                
                # Parse units from explanation (e.g. "Transfer 45 units...")
                words = rec.explanation.split(" ")
                transfer_qty = 0
                for i, w in enumerate(words):
                    if w.lower() == "transfer" and i + 1 < len(words):
                        try:
                            transfer_qty = int(words[i+1])
                            break
                        except ValueError:
                            pass
                
                if transfer_qty > 0:
                    product = db.query(Product).filter(Product.sku_code == sku).first()
                    if product:
                        src_inv = db.query(Inventory).filter(
                            Inventory.product_id == product.id,
                            Inventory.warehouse_id == src_id
                        ).first()
                        tgt_inv = db.query(Inventory).filter(
                            Inventory.product_id == product.id,
                            Inventory.warehouse_id == tgt_id
                        ).first()
                        
                        if src_inv and tgt_inv and src_inv.on_hand >= transfer_qty:
                            src_inv.on_hand -= transfer_qty
                            tgt_inv.on_hand += transfer_qty
        except Exception as e:
            # Silence failures in mock action side-effects
            print(f"Error applying approved transfer: {e}")
            
    db.commit()
    
    return {"status": "success", "message": f"Recommendation has been {request.action}"}
