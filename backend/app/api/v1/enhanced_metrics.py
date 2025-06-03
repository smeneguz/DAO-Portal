from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.models import DAO, MetricSnapshot
from app.db.session import get_db

router = APIRouter()

@router.get("/{dao_id}/enhanced_metrics", response_model=Dict[str, Any])
async def get_enhanced_dao(dao_id: int, session: AsyncSession = Depends(get_db)):
    """
    Get enhanced metrics for a specific DAO
    """
    # Fetch the DAO
    query = select(DAO).where(DAO.id == dao_id)
    result = await session.execute(query)
    dao = result.scalar_one_or_none()
    
    if not dao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DAO with ID {dao_id} not found"
        )
    
    # Get ALL metric snapshots for this DAO
    metrics_query = select(MetricSnapshot).where(MetricSnapshot.dao_id == dao_id)
    
    metrics_result = await session.execute(metrics_query)
    metrics = metrics_result.scalars().all()
    
    # Create a dict of metrics
    metrics_data = {}
    for metric in metrics:
        metrics_data[metric.metric_name] = metric.jsonb_payload
    
    # Return the structured response
    response = {
        "id": dao.id,
        "name": dao.name,
        "chain_id": dao.chain_id,
        "timestamp": dao.created_at.isoformat(),
        "network_participation": metrics_data.get("network_participation", {
            "num_distinct_voters": 0,
            "total_members": 0,
            "participation_rate": 0,
            "unique_proposers": 0
        }),
        "accumulated_funds": metrics_data.get("accumulated_funds", {
            "treasury_value_usd": 0,
            "circulating_supply": 0,
            "total_supply": 0,
            "circulating_token_percentage": 0,
            "token_velocity": 0
        }),
        "voting_efficiency": metrics_data.get("voting_efficiency", {
            "total_proposals": 0,
            "approved_proposals": 0,
            "approval_rate": 0,
            "avg_voting_duration_days": 0,
            "proposal_states": {}
        }),
        "decentralisation": metrics_data.get("decentralisation", {
            "largest_holder_percent": 0,
            "on_chain_automation": "No",
            "token_distribution": {},
            "proposer_concentration": 0
        }),
        "health_metrics": metrics_data.get("health_metrics", {
            "network_health_score": 0,
            "activity_ratio": 0,
            "total_volume": 0,
            "mean_daily_volume": 0
        })
    }
    
    return response
