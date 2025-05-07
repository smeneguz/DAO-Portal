import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine

# Import models and settings
from app.core.config import settings
from app.db.models import DAO, MetricRun, MetricSnapshot

# Create database engine
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI)

# Sample DAO data
sample_daos = [
    {
        "name": "MakerDAO",
        "chain_id": "ethereum",
        "description": "MakerDAO is a decentralized organization dedicated to bringing stability to the cryptocurrency economy through Dai, a stablecoin pegged to the US Dollar."
    },
    {
        "name": "Uniswap",
        "chain_id": "ethereum",
        "description": "Uniswap is a protocol for automated token exchange on Ethereum, enabling decentralized trading."
    },
    {
        "name": "Aave",
        "chain_id": "ethereum",
        "description": "Aave is a decentralized lending protocol where users can lend and borrow cryptocurrency assets."
    },
    {
        "name": "Compound",
        "chain_id": "ethereum", 
        "description": "Compound is an algorithmic money market protocol on Ethereum that lets users earn interest or borrow assets."
    },
    {
        "name": "ENS DAO",
        "chain_id": "ethereum",
        "description": "Ethereum Name Service DAO governs the ENS protocol which provides decentralized naming for wallets, websites, & more."
    }
]

# Sample metrics data
sample_metrics = {
    "network_participation": {
        "participation_rate": 0.37,
        "active_members": 423,
        "total_members": 1250,
        "vote_distribution": {
            "for": 78,
            "against": 22,
            "abstain": 0
        }
    },
    "health_metrics": {
        "score": 0.82,
        "active_proposals": 3,
        "treasury_growth": 0.05,
        "voter_retention": 0.91
    },
    "governance": {
        "total_proposals": 76,
        "passed_proposals": 52,
        "failed_proposals": 18,
        "pending_proposals": 6,
        "avg_duration_days": 4.5
    },
    "treasury": {
        "value_usd": 32500000,
        "assets": [
            {"symbol": "ETH", "amount": 5250, "value_usd": 15750000},
            {"symbol": "USDC", "amount": 12450000, "value_usd": 12450000},
            {"symbol": "DAI", "amount": 4300000, "value_usd": 4300000}
        ]
    }
}

# Modified model classes for this initialization script
class DAOCreate(SQLModel, table=False):
    name: str
    chain_id: str
    description: str = None
    created_at: datetime = None

async def init_db():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    # Create session
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy.orm import sessionmaker
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    # Insert sample data
    async with async_session() as session:
        # Add DAOs
        for dao_data in sample_daos:
            # Make sure to use timezone-aware datetime
            dao = DAO(
                **dao_data,
                created_at=datetime.now(timezone.utc)
            )
            session.add(dao)
        
        await session.commit()
        
        # Fetch created DAOs
        from sqlmodel import select
        result = await session.execute(select(DAO))
        daos = result.scalars().all()
        
        # Add metrics for each DAO
        for dao in daos:
            # Create a metric run with timezone-aware datetime
            metric_run = MetricRun(
                dao_id=dao.id,
                run_timestamp=datetime.now(timezone.utc),
                src_file_path=f"/data/{dao.name.lower()}_metrics.json",
                succeeded=True
            )
            session.add(metric_run)
            await session.commit()
            
            # Add metrics snapshots
            for metric_name, data in sample_metrics.items():
                # Add some variation between DAOs
                if metric_name == "network_participation":
                    variation_data = data.copy()
                    variation_data["participation_rate"] += (dao.id * 0.03)
                    variation_data["active_members"] += (dao.id * 50)
                    snapshot_data = variation_data
                elif metric_name == "treasury":
                    variation_data = data.copy()
                    variation_data["value_usd"] += (dao.id * 5000000)
                    snapshot_data = variation_data
                else:
                    snapshot_data = data
                
                metric_snapshot = MetricSnapshot(
                    dao_id=dao.id,
                    run_id=metric_run.id,
                    metric_name=metric_name,
                    jsonb_payload=snapshot_data
                )
                session.add(metric_snapshot)
            
            await session.commit()
    
    print("Database initialized with sample data!")

if __name__ == "__main__":
    asyncio.run(init_db())