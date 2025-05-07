from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_, desc

from app.api.schemas import MetricResponse, MetricSnapshotRead
from app.db.models import DAO, MetricRun, MetricSnapshot
from app.db.session import get_db
from app.workers.tasks import fetch_metrics_for_dao

router = APIRouter(tags=["Metrics"])


@router.get("/daos/{dao_id}/metrics", response_model=MetricResponse)
async def get_dao_metrics(
    dao_id: int,
    metric: Optional[str] = None,
    period: str = Query("30d", regex=r"^\d+[dwm]$"),
    session: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get metrics for a specific DAO.
    
    Args:
        dao_id: The ID of the DAO
        metric: Filter by specific metric name
        period: Time period (e.g., "30d" for 30 days, "4w" for 4 weeks, "2m" for 2 months)
        session: Database session
        
    Returns:
        Dictionary containing DAO information and metrics
        
    Raises:
        HTTPException: If DAO not found or invalid period format
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
    
    # Parse period string to calculate date range
    now = datetime.utcnow()
    
    # Extract the numeric value and unit from the period string
    value = int(period[:-1])
    unit = period[-1]
    
    if unit == 'd':
        from_date = now - timedelta(days=value)
    elif unit == 'w':
        from_date = now - timedelta(weeks=value)
    elif unit == 'm':
        from_date = now - timedelta(days=value * 30)  # Approximation for months
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid period format. Use e.g. '30d', '4w', '2m'"
        )
    
    # Get metric runs within the time period
    run_query = select(MetricRun).where(
        and_(
            MetricRun.dao_id == dao_id,
            MetricRun.run_timestamp >= from_date,
            MetricRun.succeeded == True
        )
    ).order_by(desc(MetricRun.run_timestamp))
    
    run_result = await session.execute(run_query)
    runs = run_result.scalars().all()
    
    if not runs:
        return {
            "dao_id": dao_id,
            "dao_name": dao.name,
            "metrics": {}
        }
    
    # Get the latest run for metrics
    latest_run = runs[0]
    
    # Get metrics from the latest run
    snapshot_query = select(MetricSnapshot).where(
        and_(
            MetricSnapshot.run_id == latest_run.id,
            MetricSnapshot.dao_id == dao_id
        )
    )
    
    if metric:
        snapshot_query = snapshot_query.where(MetricSnapshot.metric_name == metric)
    
    snapshot_result = await session.execute(snapshot_query)
    snapshots = snapshot_result.scalars().all()
    
    # Transform data for response
    metrics_data = {}
    for snapshot in snapshots:
        metrics_data[snapshot.metric_name] = snapshot.jsonb_payload
    
    return {
        "dao_id": dao_id,
        "dao_name": dao.name,
        "run_timestamp": latest_run.run_timestamp,
        "metrics": metrics_data
    }


@router.get("/daos/{dao_id}/metrics/history", response_model=Dict[str, Any])
async def get_dao_metrics_history(
    dao_id: int,
    metric: str = Query(..., description="The metric name to get history for"),
    period: str = Query("30d", regex=r"^\d+[dwm]$"),
    session: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get historical metrics for a specific DAO.
    
    Args:
        dao_id: The ID of the DAO
        metric: The specific metric name to get history for
        period: Time period (e.g., "30d" for 30 days, "4w" for 4 weeks, "2m" for 2 months)
        session: Database session
        
    Returns:
        Dictionary containing DAO information and historical metrics
        
    Raises:
        HTTPException: If DAO not found or invalid period format
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
    
    # Parse period string to calculate date range
    now = datetime.utcnow()
    
    # Extract the numeric value and unit from the period string
    value = int(period[:-1])
    unit = period[-1]
    
    if unit == 'd':
        from_date = now - timedelta(days=value)
    elif unit == 'w':
        from_date = now - timedelta(weeks=value)
    elif unit == 'm':
        from_date = now - timedelta(days=value * 30)  # Approximation for months
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid period format. Use e.g. '30d', '4w', '2m'"
        )
    
    # Get metric snapshots for the specified metric within the time period
    # Join with metric_run to get timestamps
    snapshot_query = select(MetricSnapshot, MetricRun.run_timestamp).join(
        MetricRun, MetricSnapshot.run_id == MetricRun.id
    ).where(
        and_(
            MetricSnapshot.dao_id == dao_id,
            MetricSnapshot.metric_name == metric,
            MetricRun.run_timestamp >= from_date,
            MetricRun.succeeded == True
        )
    ).order_by(MetricRun.run_timestamp)
    
    snapshot_result = await session.execute(snapshot_query)
    snapshot_data = snapshot_result.all()
    
    if not snapshot_data:
        return {
            "dao_id": dao_id,
            "dao_name": dao.name,
            "metric": metric,
            "history": []
        }
    
    # Transform data for response
    history = []
    for snapshot, timestamp in snapshot_data:
        history.append({
            "timestamp": timestamp,
            "data": snapshot.jsonb_payload
        })
    
    return {
        "dao_id": dao_id,
        "dao_name": dao.name,
        "metric": metric,
        "history": history
    }


@router.post("/daos/{dao_id}/poll", status_code=status.HTTP_202_ACCEPTED)
async def poll_dao_metrics(
    dao_id: int,
    session: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Trigger a metrics fetch for a specific DAO.
    
    Args:
        dao_id: The ID of the DAO
        session: Database session
        
    Returns:
        Task information
        
    Raises:
        HTTPException: If DAO not found
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
    
    # Trigger Celery task
    task = fetch_metrics_for_dao.delay(dao_id)
    
    return {
        "task_id": task.id,
        "status": "accepted",
        "message": f"Started metrics fetch for DAO: {dao.name}",
    }