from sqlalchemy import Boolean, Column, DateTime, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class DropdownMaster(Base):
    __tablename__ = "Dropdown_Master"

    DropdownID = Column(Integer, primary_key=True, index=True)
    DropdownName = Column(String(200), nullable=False)
    DropdownType = Column(String(100), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)
    Description = Column(String(500), nullable=True)
    CreatedBy = Column(String(100), nullable=False)
    CreatedDate = Column(DateTime, nullable=False)
    UpdatedBy = Column(String(100), nullable=True)
    UpdatedDate = Column(DateTime, nullable=True)
    Value = Column(String(200), nullable=True)
