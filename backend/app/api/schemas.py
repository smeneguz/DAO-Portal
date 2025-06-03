# app/api/schemas.py (New schemas for enhanced responses)

from datetime import datetime
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List, Optional

class SnapshotResponse(BaseModel):
    """Schema for metric snapshot response."""
    id: int
    dao_id: int
    run_id: int
    metric_name: str
    jsonb_payload: Dict[str, Any]

class EnhancedMetricsResponse(BaseModel):
    """Schema for enhanced DAO metrics response with all metrics included."""
    id: int
    dao_name: str
    chain_id: str
    description: Optional[str] = None
    created_at: str
    network_participation: Optional[Dict[str, Any]] = None
    accumulated_funds: Optional[Dict[str, Any]] = None
    voting_efficiency: Optional[Dict[str, Any]] = None
    decentralisation: Optional[Dict[str, Any]] = None
    health_metrics: Optional[Dict[str, Any]] = None

class DAOResponse(BaseModel):
    """Schema for DAO response with basic info."""
    id: int
    name: str
    chain_id: str
    description: Optional[str] = None
    created_at: str
    # Optional summary metrics
    participation_rate: Optional[float] = None
    total_members: Optional[int] = None
    treasury_value_usd: Optional[float] = None
    total_proposals: Optional[int] = None
    approval_rate: Optional[float] = None
    network_health_score: Optional[float] = None

class DAOListResponse(BaseModel):
    """Schema for paginated DAO list response."""
    items: List[DAOResponse]
    total: int
    limit: int
    offset: int


class DAOBase(BaseModel):
    """Base DAO schema."""
    
    name: str
    chain_id: str
    description: Optional[str] = None


class DAOCreate(DAOBase):
    """Schema for creating a DAO."""
    pass


class DAORead(DAOBase):
    """Schema for reading a DAO."""
    
    id: int
    created_at: datetime
    
    class Config:
        orm_mode = True


class DAOList(BaseModel):
    """Schema for list of DAOs with pagination."""
    
    items: List[DAORead]
    total: int
    page: int
    size: int
    pages: int


class MetricRunRead(BaseModel):
    """Schema for reading a metric run."""
    
    id: int
    dao_id: int
    run_timestamp: datetime
    src_file_path: str
    succeeded: bool
    
    class Config:
        orm_mode = True


class MetricSnapshotBase(BaseModel):
    """Base metric snapshot schema."""
    
    metric_name: str
    jsonb_payload: Dict[str, Any]


class MetricSnapshotCreate(MetricSnapshotBase):
    """Schema for creating a metric snapshot."""
    
    dao_id: int
    run_id: int


class MetricSnapshotRead(MetricSnapshotBase):
    """Schema for reading a metric snapshot."""
    
    id: int
    dao_id: int
    run_id: int
    
    class Config:
        orm_mode = True


class MetricResponse(BaseModel):
    """Schema for metric response."""
    
    dao_id: int
    dao_name: str
    metrics: Dict[str, Any]
    run_timestamp: Optional[datetime] = None


class ContractConfigBase(BaseModel):
    """Base contract configuration schema."""
    
    address: str
    type: str
    name: str
    deployed_at: datetime


class ContractConfigCreate(ContractConfigBase):
    """Schema for creating a contract configuration."""
    
    dao_id: int


class ContractConfigRead(ContractConfigBase):
    """Schema for reading a contract configuration."""
    
    id: int
    dao_id: int
    
    class Config:
        orm_mode = True


class TokenConfigBase(BaseModel):
    """Base token configuration schema."""
    
    address: str
    type: str
    name: str
    deployed_at: datetime


class TokenConfigCreate(TokenConfigBase):
    """Schema for creating a token configuration."""
    
    dao_id: int


class TokenConfigRead(TokenConfigBase):
    """Schema for reading a token configuration."""
    
    id: int
    dao_id: int
    
    class Config:
        orm_mode = True


class ErrorResponse(BaseModel):
    """Schema for error response."""
    
    error: str
    code: Optional[int] = None
    details: Optional[Dict[str, Any]] = None