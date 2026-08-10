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

class ExpenseCreate(BaseModel):
    category: str
    date: date
    amount: Decimal
    mileage: int | None = None
    notes: str | None = None


class ExpenseResponse(ExpenseCreate):
    id: int
    vehicle_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReminderCreate(BaseModel):
    title: str
    due_date: date | None = None
    due_mileage: int | None = None
    notes: str | None = None
    completed: bool = False


class ReminderResponse(ReminderCreate):
    id: int
    vehicle_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CategoryStat(BaseModel):
    category: str
    amount: Decimal


class MonthlyStat(BaseModel):
    month: str
    expenses: Decimal
    maintenance: Decimal
    total: Decimal


class DashboardResponse(BaseModel):
    vehicles_count: int
    expenses_count: int
    maintenances_count: int

    total_expenses: Decimal
    total_maintenance: Decimal
    total_spending: Decimal

    active_reminders: int
    overdue_reminders: int

    expenses_by_category: list[CategoryStat]
    monthly_spending: list[MonthlyStat]