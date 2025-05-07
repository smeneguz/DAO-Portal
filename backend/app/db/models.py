from datetime import datetime
from typing import Dict, List, Optional
from sqlmodel import Field, SQLModel, Relationship, JSON, Column, TIMESTAMP


class DAO(SQLModel, table=True):
    """DAO entity model."""
    
    __tablename__ = "dao"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    chain_id: str = Field(index=True)
    description: Optional[str] = None
    created_at: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True)),
        default_factory=datetime.utcnow
    )
    
    # Relationships
    metric_runs: List["MetricRun"] = Relationship(back_populates="dao")
    metric_snapshots: List["MetricSnapshot"] = Relationship(back_populates="dao")
    contract_configs: List["ContractConfig"] = Relationship(back_populates="dao")
    token_configs: List["TokenConfig"] = Relationship(back_populates="dao")


class MetricRun(SQLModel, table=True):
    """Metric run entity model."""
    
    __tablename__ = "metric_run"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    dao_id: int = Field(foreign_key="dao.id", index=True)
    run_timestamp: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True)),
        default_factory=datetime.utcnow
    )
    src_file_path: str
    succeeded: bool = True
    
    # Relationships
    dao: DAO = Relationship(back_populates="metric_runs")
    metric_snapshots: List["MetricSnapshot"] = Relationship(back_populates="run")


class MetricSnapshot(SQLModel, table=True):
    """Metric snapshot entity model."""
    
    __tablename__ = "metric_snapshot"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    dao_id: int = Field(foreign_key="dao.id", index=True)
    run_id: int = Field(foreign_key="metric_run.id", index=True)
    metric_name: str = Field(index=True)
    jsonb_payload: Dict = Field(sa_column=Column(JSON))
    
    # Relationships
    dao: DAO = Relationship(back_populates="metric_snapshots")
    run: MetricRun = Relationship(back_populates="metric_snapshots")


class ContractConfig(SQLModel, table=True):
    """Contract configuration entity model."""
    
    __tablename__ = "contract_config"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    dao_id: int = Field(foreign_key="dao.id", index=True)
    address: str = Field(index=True)
    type: str
    name: str
    deployed_at: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True))
    )
    
    # Relationships
    dao: DAO = Relationship(back_populates="contract_configs")


class TokenConfig(SQLModel, table=True):
    """Token configuration entity model."""
    
    __tablename__ = "token_config"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    dao_id: int = Field(foreign_key="dao.id", index=True)
    address: str = Field(index=True)
    type: str
    name: str
    deployed_at: datetime = Field(
        sa_column=Column(TIMESTAMP(timezone=True))
    )
    
    # Relationships
    dao: DAO = Relationship(back_populates="token_configs")