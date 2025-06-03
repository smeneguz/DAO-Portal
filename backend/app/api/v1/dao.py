# app/api/v1/dao.py
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_, or_, func

from app.db.models import DAO, MetricSnapshot, MetricRun
from app.db.session import get_db

router = APIRouter(tags=["DAOs"])

@router.get("/daos", response_model=Dict[str, Any])
async def get_daos(
    search: Optional[str] = None,
    chain_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: AsyncSession = Depends(get_db)
):
    """
    Get a list of DAOs with filtering options
    """
    # Build the query
    query = select(DAO)
    
    # Apply filters
    if search:
        query = query.where(or_(
            DAO.name.ilike(f"%{search}%"),
            DAO.description.ilike(f"%{search}%") if DAO.description else False
        ))
    
    if chain_id:
        query = query.where(DAO.chain_id == chain_id)
    
    # Get total count
    count_query = select(func.count()).select_from(select(DAO).subquery())
    if search:
        count_query = select(func.count()).select_from(
            select(DAO).where(or_(
                DAO.name.ilike(f"%{search}%"),
                DAO.description.ilike(f"%{search}%") if DAO.description else False
            )).subquery()
        )
    if chain_id:
        count_query = select(func.count()).select_from(
            select(DAO).where(DAO.chain_id == chain_id).subquery()
        )
    
    total_count_result = await session.execute(count_query)
    total_count = total_count_result.scalar() or 0
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await session.execute(query)
    daos = result.scalars().all()
    
    # Transform data for response
    dao_list = []
    for dao in daos:
        # Get metrics directly from MetricSnapshot (same approach as enhanced_metrics)
        metrics_query = select(MetricSnapshot).where(MetricSnapshot.dao_id == dao.id)
        metrics_result = await session.execute(metrics_query)
        metrics = metrics_result.scalars().all()
        
        # Create a dict of metrics
        metrics_data = {}
        for metric in metrics:
            metrics_data[metric.metric_name] = metric.jsonb_payload
        
        # Build the DAO object with metrics data
        dao_item = {
            "id": dao.id,
            "name": dao.name,
            "chain_id": dao.chain_id,
            "description": dao.description or f"{dao.name} is a decentralized autonomous organization.",
            "created_at": dao.created_at.isoformat()
        }
        
        # Add metrics if available - using the same structure as enhanced_metrics
        if "network_participation" in metrics_data:
            dao_item["participation_rate"] = metrics_data["network_participation"].get("participation_rate")
            dao_item["total_members"] = metrics_data["network_participation"].get("total_members")
        
        if "accumulated_funds" in metrics_data:
            dao_item["treasury_value_usd"] = metrics_data["accumulated_funds"].get("treasury_value_usd")
        
        if "voting_efficiency" in metrics_data:
            dao_item["total_proposals"] = metrics_data["voting_efficiency"].get("total_proposals")
            dao_item["approval_rate"] = metrics_data["voting_efficiency"].get("approval_rate")
        
        if "health_metrics" in metrics_data:
            dao_item["network_health_score"] = metrics_data["health_metrics"].get("network_health_score")
        
        dao_list.append(dao_item)
    
    return {
        "items": dao_list,
        "total_count": total_count,
        "limit": limit,
        "offset": offset
    }

@router.get("/daos/{dao_id}", response_model=Dict[str, Any])
async def get_dao(dao_id: int, session: AsyncSession = Depends(get_db)):
    """
    Get a specific DAO by ID
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
    
    # Get the latest run for this DAO
    latest_run_query = select(MetricRun).where(
        MetricRun.dao_id == dao_id
    ).order_by(MetricRun.run_timestamp.desc()).limit(1)
    
    latest_run_result = await session.execute(latest_run_query)
    latest_run = latest_run_result.scalar_one_or_none()
    
    # Create base response
    response = {
        "id": dao.id,
        "name": dao.name,
        "chain_id": dao.chain_id,
        "description": dao.description or f"{dao.name} is a decentralized autonomous organization.",
        "created_at": dao.created_at.isoformat()
    }
    
    if latest_run:
        # Get metrics from this run
        metrics_query = select(MetricSnapshot).where(
            and_(
                MetricSnapshot.dao_id == dao_id,
                MetricSnapshot.run_id == latest_run.id
            )
        )
        
        metrics_result = await session.execute(metrics_query)
        metrics = metrics_result.scalars().all()
        
        # Add metrics to response
        for metric in metrics:
            response[metric.metric_name] = metric.jsonb_payload
    
    return response

# Create a fixed version of the enhanced_metrics endpoint
@router.get("/daos/{dao_id}/enhanced_metrics", response_model=Dict[str, Any])
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
    
    # Get metrics directly without requiring a run
    metrics_query = select(MetricSnapshot).where(MetricSnapshot.dao_id == dao_id)
    
    metrics_result = await session.execute(metrics_query)
    metrics = metrics_result.scalars().all()
    
    # Create a dict of metrics
    metrics_data = {}
    for metric in metrics:
        metrics_data[metric.metric_name] = metric.jsonb_payload
    
    # Create enhanced response
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


@router.get("/daos/metrics/multi", response_model=List[Dict[str, Any]])
async def get_multi_dao_metrics(
    dao_ids: str = Query(..., description="Comma-separated list of DAO IDs"),
    session: AsyncSession = Depends(get_db)
):
    """
    Get metrics for multiple DAOs at once
    """
    id_list = [int(id.strip()) for id in dao_ids.split(",") if id.strip().isdigit()]
    
    if not id_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid DAO IDs provided"
        )
    
    result = []
    for dao_id in id_list:
        try:
            # Use the same logic as the single DAO endpoint
            dao_query = select(DAO).where(DAO.id == dao_id)
            dao_result = await session.execute(dao_query)
            dao = dao_result.scalar_one_or_none()
            
            if dao:
                # Get metrics for this DAO
                metrics_query = select(MetricSnapshot).where(MetricSnapshot.dao_id == dao_id)
                metrics_result = await session.execute(metrics_query)
                metrics = metrics_result.scalars().all()
                
                # Create metrics data
                metrics_data = {}
                for metric in metrics:
                    metrics_data[metric.metric_name] = metric.jsonb_payload
                
                dao_response = {
                    "id": dao.id,
                    "name": dao.name,
                    "chain_id": dao.chain_id,
                    "timestamp": dao.created_at.isoformat(),
                    "network_participation": metrics_data.get("network_participation", {}),
                    "accumulated_funds": metrics_data.get("accumulated_funds", {}),
                    "voting_efficiency": metrics_data.get("voting_efficiency", {}),
                    "decentralisation": metrics_data.get("decentralisation", {}),
                    "health_metrics": metrics_data.get("health_metrics", {})
                }
                
                result.append(dao_response)
        except Exception as e:
            # Skip DAOs that cause errors
            continue
    
    return result