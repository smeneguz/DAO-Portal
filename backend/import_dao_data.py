import json
import asyncio
import sys
from datetime import datetime
from pathlib import Path

from sqlmodel import select, SQLModel
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Import models (adjust path if needed)
from app.db.models import DAO, MetricRun, MetricSnapshot
from app.core.config import settings

# Create async engine
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI)

# Create session factory
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def import_data(file_path: str):
    """Import DAO data from a JSON file."""
    print(f"Importing data from {file_path}...")
    
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Read JSON file
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Process data
    async with async_session() as session:
        # Process each DAO first
        for dao_data in data:
            dao_name = dao_data.get('dao_name')
            if not dao_name:
                print("Skipping entry with no DAO name")
                continue
            
            # Check if DAO exists
            result = await session.execute(select(DAO).where(DAO.name == dao_name))
            dao = result.scalars().first()
            
            # If DAO doesn't exist, create it
            if not dao:
                chain_id = str(dao_data.get('chain_id', ''))
                description = f"DAO on chain ID {chain_id}"
                
                dao = DAO(
                    name=dao_name,
                    chain_id=chain_id,
                    description=description,
                    created_at=datetime.utcnow()
                )
                session.add(dao)
                await session.commit()
                await session.refresh(dao)
                print(f"Created new DAO: {dao_name} (ID: {dao.id})")
            else:
                print(f"Found existing DAO: {dao_name} (ID: {dao.id})")
            
            # Now create a MetricRun for this DAO
            metric_run = MetricRun(
                dao_id=dao.id,  # Now we have a valid dao_id
                run_timestamp=datetime.utcnow(),
                src_file_path=file_path,
                succeeded=True
            )
            session.add(metric_run)
            await session.commit()
            await session.refresh(metric_run)
            
            # Create metric snapshots
            metrics_to_store = {
                "network_participation": dao_data.get("network_participation", {}),
                "accumulated_funds": dao_data.get("accumulated_funds", {}),
                "voting_efficiency": dao_data.get("voting_efficiency", {}),
                "decentralisation": dao_data.get("decentralisation", {}),
                "health_metrics": dao_data.get("health_metrics", {})
            }
            
            for metric_name, payload in metrics_to_store.items():
                metric = MetricSnapshot(
                    dao_id=dao.id,
                    run_id=metric_run.id,
                    metric_name=metric_name,
                    jsonb_payload=payload
                )
                session.add(metric)
            
            await session.commit()
            print(f"Added metrics for {dao_name}")
        
        print(f"Successfully imported {len(data)} DAOs")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = "/data/dao_data.json"
    
    asyncio.run(import_data(file_path))