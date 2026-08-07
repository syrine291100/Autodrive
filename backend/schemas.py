from datetime import datetime

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