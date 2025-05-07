from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_, desc

from app.db.models import DAO, MetricSnapshot
from app.db.session import get_db

router = APIRouter(tags=["Enhanced Metrics"])

@router.get("/daos/{dao_id}/enhanced-metrics")
async def get_dao_enhanced_metrics(
    dao_id: int,
    session: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get enhanced metrics for a specific DAO.
    """
    # Verify DAO exists
    dao_query = select(DAO).where(DAO.id == dao_id)
    result = await session.execute(dao_query)
    dao = result.scalars().first()
    
    if not dao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DAO with ID {dao_id} not found"
        )
    
    # Get all metrics for this DAO
    query = select(MetricSnapshot).where(MetricSnapshot.dao_id == dao_id)
    result = await session.execute(query)
    snapshots = result.scalars().all()
    
    if not snapshots:
        return {
            "dao_id": dao_id,
            "dao_name": dao.name,
            "metrics": {}
        }
    
    # Group metrics by name
    metrics = {}
    for snapshot in snapshots:
        metrics[snapshot.metric_name] = snapshot.jsonb_payload
    
    return {
        "dao_id": dao_id,
        "dao_name": dao.name,
        "chain_id": dao.chain_id,
        "metrics": metrics
    }


@router.get("/daos/{dao_id}/token-distribution")
async def get_dao_token_distribution(
    dao_id: int,
    session: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get token distribution data for a specific DAO.
    """
    # Verify DAO exists
    dao_query = select(DAO).where(DAO.id == dao_id)
    result = await session.execute(dao_query)
    dao = result.scalars().first()
    
    if not dao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DAO with ID {dao_id} not found"
        )
    
    # Get decentralisation metrics
    query = select(MetricSnapshot).where(
        and_(
            MetricSnapshot.dao_id == dao_id,
            MetricSnapshot.metric_name == "decentralisation"
        )
    )
    result = await session.execute(query)
    snapshot = result.scalars().first()
    
    if not snapshot:
        return {
            "dao_id": dao_id,
            "dao_name": dao.name,
            "token_distribution": {},
            "largest_holder_percent": 0
        }
    
    # Extract distribution data
    distribution = snapshot.jsonb_payload.get("token_distribution", {})
    largest_holder = snapshot.jsonb_payload.get("largest_holder_percent", 0)
    
    return {
        "dao_id": dao_id,
        "dao_name": dao.name,
        "token_distribution": distribution,
        "largest_holder_percent": largest_holder
    }