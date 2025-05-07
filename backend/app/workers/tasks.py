import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from sqlmodel import select
from sqlalchemy.orm import Session

from app.db.session_sync import get_db_sync
from app.db.models import DAO, MetricRun, MetricSnapshot
from app.workers.celery_app import celery_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@celery_app.task(name="fetch_metrics_for_dao")
def fetch_metrics_for_dao(dao_id: int, data_dir: str = "/data") -> Dict[str, Any]:
    """
    Fetch metrics for a specific DAO.
    
    Args:
        dao_id: The ID of the DAO
        data_dir: The directory containing JSON metric files
    
    Returns:
        Dict with task execution status and details
    """
    logger.info(f"Fetching metrics for DAO ID: {dao_id}")
    
    # Get DB session
    db = next(get_db_sync())
    
    try:
        # Get DAO
        dao = db.query(DAO).filter(DAO.id == dao_id).first()
        if not dao:
            logger.error(f"DAO ID {dao_id} not found")
            return {"error": "DAO not found", "status": "failed"}
        
        # Create metric run
        metric_run = MetricRun(
            dao_id=dao.id,
            run_timestamp=datetime.utcnow(),
            src_file_path="",
            succeeded=False
        )
        db.add(metric_run)
        db.commit()
        db.refresh(metric_run)
        
        # Find the appropriate JSON file
        data_path = Path(data_dir)
        src_file_path = None
        
        # Look for files matching the DAO name
        for file_path in data_path.glob(f"*{dao.name}*.json"):
            src_file_path = str(file_path)
            break
        
        # If no file found, try chain_id
        if not src_file_path:
            for file_path in data_path.glob(f"*{dao.chain_id}*.json"):
                src_file_path = str(file_path)
                break
        
        if not src_file_path:
            logger.error(f"No JSON metric file found for DAO: {dao.name}")
            return {
                "error": f"No JSON metric file found for DAO: {dao.name}",
                "status": "failed",
                "dao_id": dao.id,
                "dao_name": dao.name,
            }
        
        # Update the run with the file path
        metric_run.src_file_path = src_file_path
        db.add(metric_run)
        db.commit()
        
        # Process the JSON file
        with open(src_file_path, "r") as f:
            data = json.load(f)
        
        # Extract metrics from the JSON file
        processed_metrics = process_metrics_from_json(data)
        
        # Save metrics to database
        for metric_name, payload in processed_metrics.items():
            metric_snapshot = MetricSnapshot(
                dao_id=dao.id,
                run_id=metric_run.id,
                metric_name=metric_name,
                jsonb_payload=payload
            )
            db.add(metric_snapshot)
        
        # Mark the run as succeeded
        metric_run.succeeded = True
        db.add(metric_run)
        db.commit()
        
        logger.info(f"Successfully processed metrics for DAO: {dao.name}")
        return {
            "status": "success",
            "dao_id": dao.id,
            "dao_name": dao.name,
            "metrics_count": len(processed_metrics),
            "file_path": src_file_path
        }
        
    except Exception as e:
        logger.error(f"Error processing metrics for DAO ID {dao_id}: {str(e)}")
        return {
            "error": str(e),
            "status": "failed",
            "dao_id": dao_id
        }
    finally:
        db.close()


def process_metrics_from_json(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process metrics from JSON data.
    
    Extracts KPI blocks from the JSON data.
    
    Args:
        data: The JSON data containing metrics
        
    Returns:
        Dictionary of processed metrics
    """
    metrics = {}
    
    # Extract standard KPI blocks
    # Customize based on your actual JSON structure
    standard_metrics = [
        "network_participation",
        "health_metrics",
        "governance",
        "treasury",
        "token_metrics",
        "proposal_stats"
    ]
    
    for metric_name in standard_metrics:
        if metric_name in data:
            metrics[metric_name] = data[metric_name]
    
    # If there are nested metrics, extract them
    if "metrics" in data and isinstance(data["metrics"], dict):
        for key, value in data["metrics"].items():
            metrics[key] = value
    
    return metrics


@celery_app.task(name="fetch_metrics_for_all_daos")
def fetch_metrics_for_all_daos() -> Dict[str, Any]:
    """
    Fetch metrics for all DAOs in the database.
    
    Returns:
        Dict with task execution status and details
    """
    logger.info("Starting metrics fetch for all DAOs")
    
    # Get DB session
    db = next(get_db_sync())
    
    try:
        # Get all DAOs
        daos = db.query(DAO).all()
        dao_count = len(daos)
        
        if dao_count == 0:
            return {"status": "success", "message": "No DAOs found to process"}
        
        # Queue individual tasks for each DAO
        for dao in daos:
            fetch_metrics_for_dao.delay(dao.id)
        
        return {
            "status": "success",
            "message": f"Queued metric fetching for {dao_count} DAOs"
        }
    
    except Exception as e:
        logger.error(f"Error scheduling metrics fetch: {str(e)}")
        return {
            "error": str(e),
            "status": "failed"
        }
    finally:
        db.close()