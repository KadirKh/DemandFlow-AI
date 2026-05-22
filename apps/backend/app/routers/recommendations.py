from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from enum import Enum
from ..database import get_db
from ..models import Recommendation, Inventory, Product
from ..security import get_current_user
from ..logging_config import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

class ActionEnum(str, Enum):
    """Valid recommendation actions"""
    APPROVED = "approved"
    REJECTED = "rejected"

class ActionRequest(BaseModel):
    action: ActionEnum
    
    @field_validator("action")
    @classmethod
    def validate_action(cls, v: ActionEnum) -> ActionEnum:
        if v not in [ActionEnum.APPROVED, ActionEnum.REJECTED]:
            raise ValueError(f"Action must be '{ActionEnum.APPROVED}' or '{ActionEnum.REJECTED}'")
        return v

@router.get("")
def list_recommendations(
    user_info=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all recommendations sorted by impact score"""
    try:
        user_id = user_info["user_id"]
        logger.debug(f"Fetching recommendations for user {user_id}")
        # Fetch user's active recommendations, or pre-seeded ones if user has no uploaded data
        recs = db.query(Recommendation).filter(
            (Recommendation.user_id == user_id) | (Recommendation.user_id == None)
        ).filter(
            Recommendation.active == True
        ).order_by(Recommendation.score.desc()).all()
        logger.info(f"Successfully fetched {len(recs)} recommendations")
        return recs
    except Exception as e:
        logger.error(f"Error fetching recommendations: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch recommendations"
        )

@router.post("/{rec_id}/action")
def update_recommendation_status(
    rec_id: int,
    request: ActionRequest,
    _user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update recommendation status (approved/rejected) and apply side effects if approved"""
    try:
        # Validate rec_id
        if rec_id <= 0:
            logger.warning(f"Invalid recommendation ID: {rec_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recommendation ID must be a positive integer"
            )
        
        logger.debug(f"Processing action '{request.action}' for recommendation {rec_id}")
        
        rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
        if not rec:
            logger.warning(f"Recommendation {rec_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Recommendation {rec_id} not found"
            )
        
        rec.action_status = request.action.value
        
        # If recommendation is approved, apply side effects
        if request.action == ActionEnum.APPROVED and rec.type == "transfer":
            try:
                logger.debug(f"Applying transfer side-effect for recommendation {rec_id}")
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
                        if not product:
                            logger.warning(f"Product SKU {sku} not found for transfer")
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Product SKU {sku} not found"
                            )
                        
                        src_inv = db.query(Inventory).filter(
                            Inventory.product_id == product.id,
                            Inventory.warehouse_id == src_id
                        ).first()
                        tgt_inv = db.query(Inventory).filter(
                            Inventory.product_id == product.id,
                            Inventory.warehouse_id == tgt_id
                        ).first()
                        
                        if not src_inv or not tgt_inv:
                            logger.warning(f"Inventory records not found for transfer")
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Source or target warehouse inventory not found"
                            )
                        
                        if src_inv.on_hand < transfer_qty:
                            logger.warning(f"Insufficient inventory: {src_inv.on_hand} < {transfer_qty}")
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Insufficient inventory: {src_inv.on_hand} units available"
                            )
                        
                        src_inv.on_hand -= transfer_qty
                        tgt_inv.on_hand += transfer_qty
                        logger.info(f"Transfer completed: {transfer_qty} units from warehouse {src_id} to {tgt_id}")
            except HTTPException:
                raise  # Re-raise HTTP exceptions
            except Exception as e:
                logger.error(f"Error applying transfer side-effect: {str(e)}")
                # Don't fail the entire request if side-effect fails
                logger.info(f"Recommendation status updated to {request.action.value} despite side-effect error")
        
        db.commit()
        logger.info(f"Recommendation {rec_id} status updated to {request.action.value}")
        
        return {
            "status": "success",
            "message": f"Recommendation has been {request.action.value}"
        }
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        logger.error(f"Unexpected error updating recommendation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update recommendation status"
        )
