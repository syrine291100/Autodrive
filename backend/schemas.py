from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class VehicleCreate(BaseModel):
    brand: str
    model: str
    year: int
    registration: str
    mileage: int
    fuel_type: str


class VehicleResponse(VehicleCreate):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaintenanceCreate(BaseModel):
    type: str
    date: date
    mileage: int
    cost: Decimal
    notes: str | None = None


class MaintenanceResponse(MaintenanceCreate):
    id: int
    vehicle_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)