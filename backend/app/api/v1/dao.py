from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func

from app.api.schemas import DAOCreate, DAORead, DAOList
from app.db.models import DAO
from app.db.session import get_db

router = APIRouter(prefix="/daos", tags=["DAOs"])


@router.get("/", response_model=DAOList)
async def get_daos(
    session: AsyncSession = Depends(get_db),
    name: Optional[str] = None,
    chain_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
) -> Dict[str, Any]:
    """
    Get list of DAOs with pagination and filtering.
    
    Args:
        session: Database session
        name: Filter by name (case-insensitive partial match)
        chain_id: Filter by chain ID
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        Paginated list of DAOs
    """
    # Build query for data
    query = select(DAO)
    
    # Apply filters
    if name:
        query = query.where(DAO.name.ilike(f"%{name}%"))
    if chain_id:
        query = query.where(DAO.chain_id == chain_id)
    
    # Execute count query
    count_query = select(func.count()).select_from(query.subquery())
    total = await session.scalar(count_query)
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute data query
    result = await session.execute(query)
    daos = result.scalars().all()
    
    # Calculate pagination values
    pages = (total + limit - 1) // limit
    page = skip // limit + 1
    
    return {
        "items": daos,
        "total": total,
        "page": page,
        "size": limit,
        "pages": pages
    }


@router.get("/{dao_id}", response_model=DAORead)
async def get_dao(
    dao_id: int,
    session: AsyncSession = Depends(get_db)
) -> DAO:
    """
    Get a specific DAO by ID.
    
    Args:
        dao_id: The ID of the DAO
        session: Database session
        
    Returns:
        DAO object if found
        
    Raises:
        HTTPException: If DAO not found
    """
    query = select(DAO).where(DAO.id == dao_id)
    result = await session.execute(query)
    dao = result.scalars().first()
    
    if not dao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DAO with ID {dao_id} not found"
        )
    
    return dao


@router.post("/", response_model=DAORead, status_code=status.HTTP_201_CREATED)
async def create_dao(
    dao_data: DAOCreate,
    session: AsyncSession = Depends(get_db)
) -> DAO:
    """
    Create a new DAO.
    
    Args:
        dao_data: DAO creation data
        session: Database session
        
    Returns:
        Created DAO
        
    Raises:
        HTTPException: If DAO with the same name already exists
    """
    # Check if DAO with the same name already exists
    query = select(DAO).where(DAO.name == dao_data.name)
    result = await session.execute(query)
    existing_dao = result.scalars().first()
    
    if existing_dao:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"DAO with name '{dao_data.name}' already exists"
        )
    
    # Create new DAO
    dao = DAO.from_orm(dao_data)
    session.add(dao)
    await session.commit()
    await session.refresh(dao)
    
    return dao