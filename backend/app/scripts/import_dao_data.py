# app/scripts/import_dao_data.py
import json
import sys
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, Session

from app.db.session import init_db, async_session
from app.db.models import DAO, MetricSnapshot, MetricRun

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("dao_importer")

async def import_data(file_path: str) -> None:
    """
    Import DAO data from JSON into our existing database structure
    
    Args:
        file_path: Path to the JSON file with DAO data
    """
    # Initialize the database if needed
    await init_db()
    
    # Open JSON file
    try:
        with open(file_path, "r") as f:
            data = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load JSON file: {e}")
        return
    
    async with async_session() as db:
        # Create a MetricRun to track this import
        run = MetricRun(
            src_file_path=file_path,
            run_timestamp=datetime.utcnow(),
            succeeded=True
        )
        
        # Process each DAO in the JSON data
        logger.info(f"Processing {len(data)} DAOs...")
        
        for dao_data in data:
            dao_name = dao_data.get("dao_name")
            if not dao_name:
                logger.warning(f"Skipping DAO record without name: {dao_data}")
                continue
            
            # Check if DAO already exists
            query = select(DAO).where(DAO.name == dao_name)
            result = await db.execute(query)
            dao = result.scalar_one_or_none()
            
            # Create or update the DAO
            if dao:
                logger.info(f"DAO already exists: {dao_name} (ID: {dao.id})")
            else:
                logger.info(f"Creating new DAO: {dao_name}")
                dao = DAO(
                    name=dao_name,
                    chain_id=str(dao_data.get("chain_id", 1)),
                    description=f"{dao_name} is a decentralized autonomous organization."
                )
                db.add(dao)
                await db.flush()  # Generate ID
            
            # Set the DAO ID in the run
            run.dao_id = dao.id
            db.add(run)
            await db.flush()  # Generate ID for the run
            
            # Process metrics
            metric_categories = {
                "network_participation": dao_data.get("network_participation", {}),
                "accumulated_funds": dao_data.get("accumulated_funds", {}),
                "voting_efficiency": dao_data.get("voting_efficiency", {}),
                "decentralisation": dao_data.get("decentralisation", {}),
                "health_metrics": dao_data.get("health_metrics", {})
            }
            
            # Create a metric snapshot for each category
            for metric_name, payload in metric_categories.items():
                if payload:  # Only add non-empty metrics
                    snapshot = MetricSnapshot(
                        dao_id=dao.id,
                        run_id=run.id,
                        metric_name=metric_name,
                        jsonb_payload=payload
                    )
                    db.add(snapshot)
            
            # Commit after each DAO
            await db.commit()
        
        logger.info(f"Successfully processed {len(data)} DAOs")

async def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.scripts.import_dao_data <data_file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    await import_data(file_path)

if __name__ == "__main__":
    asyncio.run(main())