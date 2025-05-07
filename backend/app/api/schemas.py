from datetime import datetime
from typing import Dict, List, Optional, Any

from pydantic import BaseModel, Field, validator


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