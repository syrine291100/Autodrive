from datetime import date
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, text
from sqlalchemy.orm import Session

import auth
import models
import schemas
from database import engine, get_db


app = FastAPI(
    title="AutoDrive API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AutoDrive API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/database")
def database_health_check():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": "connected",
    }


def get_owned_vehicle(
    vehicle_id: int,
    current_user: models.User,
    db: Session,
) -> models.Vehicle:
    vehicle = db.scalar(
        select(models.Vehicle).where(
            models.Vehicle.id == vehicle_id,
            models.Vehicle.user_id == current_user.id,
        )
    )

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found.",
        )

    return vehicle


@app.post(
    "/vehicles",
    response_model=schemas.VehicleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vehicle(
    vehicle: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    existing_vehicle = db.scalar(
        select(models.Vehicle).where(
            models.Vehicle.registration == vehicle.registration
        )
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A vehicle with this registration already exists.",
        )

    new_vehicle = models.Vehicle(
        user_id=current_user.id,
        **vehicle.model_dump(),
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return new_vehicle


@app.get(
    "/vehicles",
    response_model=list[schemas.VehicleResponse],
)
def get_vehicles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    vehicles = db.scalars(
        select(models.Vehicle)
        .where(models.Vehicle.user_id == current_user.id)
        .order_by(models.Vehicle.id)
    ).all()

    return vehicles


@app.get(
    "/vehicles/{vehicle_id}",
    response_model=schemas.VehicleResponse,
)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )


@app.put(
    "/vehicles/{vehicle_id}",
    response_model=schemas.VehicleResponse,
)
def update_vehicle(
    vehicle_id: int,
    vehicle_data: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    vehicle = get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )

    duplicate = db.scalar(
        select(models.Vehicle).where(
            models.Vehicle.registration == vehicle_data.registration,
            models.Vehicle.id != vehicle_id,
        )
    )

    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A vehicle with this registration already exists.",
        )

    for field, value in vehicle_data.model_dump().items():
        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)

    return vehicle


@app.delete(
    "/vehicles/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    vehicle = get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )

    db.delete(vehicle)
    db.commit()


@app.post(
    "/vehicles/{vehicle_id}/maintenances",
    response_model=schemas.MaintenanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_maintenance(
    vehicle_id: int,
    maintenance: schemas.MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )

    new_maintenance = models.Maintenance(
        vehicle_id=vehicle_id,
        **maintenance.model_dump(),
    )

    db.add(new_maintenance)
    db.commit()
    db.refresh(new_maintenance)

    return new_maintenance


@app.get(
    "/vehicles/{vehicle_id}/maintenances",
    response_model=list[schemas.MaintenanceResponse],
)
def get_vehicle_maintenances(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )

    maintenances = db.scalars(
        select(models.Maintenance)
        .where(models.Maintenance.vehicle_id == vehicle_id)
        .order_by(models.Maintenance.date.desc())
    ).all()

    return maintenances


@app.put(
    "/maintenances/{maintenance_id}",
    response_model=schemas.MaintenanceResponse,
)
def update_maintenance(
    maintenance_id: int,
    maintenance_data: schemas.MaintenanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    maintenance = db.scalar(
        select(models.Maintenance)
        .join(
            models.Vehicle,
            models.Maintenance.vehicle_id == models.Vehicle.id,
        )
        .where(
            models.Maintenance.id == maintenance_id,
            models.Vehicle.user_id == current_user.id,
        )
    )

    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance not found.",
        )

    for field, value in maintenance_data.model_dump().items():
        setattr(maintenance, field, value)

    db.commit()
    db.refresh(maintenance)

    return maintenance


@app.delete(
    "/maintenances/{maintenance_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_maintenance(
    maintenance_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    maintenance = db.scalar(
        select(models.Maintenance)
        .join(
            models.Vehicle,
            models.Maintenance.vehicle_id == models.Vehicle.id,
        )
        .where(
            models.Maintenance.id == maintenance_id,
            models.Vehicle.user_id == current_user.id,
        )
    )

    if not maintenance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance not found.",
        )

    db.delete(maintenance)
    db.commit()


@app.post(
    "/vehicles/{vehicle_id}/expenses",
    response_model=schemas.ExpenseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    vehicle_id: int,
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )

    new_expense = models.Expense(
        vehicle_id=vehicle_id,
        **expense.model_dump(),
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


@app.get(
    "/vehicles/{vehicle_id}/expenses",
    response_model=list[schemas.ExpenseResponse],
)
def get_vehicle_expenses(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )

    expenses = db.scalars(
        select(models.Expense)
        .where(models.Expense.vehicle_id == vehicle_id)
        .order_by(models.Expense.date.desc())
    ).all()

    return expenses


@app.put(
    "/expenses/{expense_id}",
    response_model=schemas.ExpenseResponse,
)
def update_expense(
    expense_id: int,
    expense_data: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    expense = db.scalar(
        select(models.Expense)
        .join(
            models.Vehicle,
            models.Expense.vehicle_id == models.Vehicle.id,
        )
        .where(
            models.Expense.id == expense_id,
            models.Vehicle.user_id == current_user.id,
        )
    )

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found.",
        )

    for field, value in expense_data.model_dump().items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    return expense


@app.delete(
    "/expenses/{expense_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    expense = db.scalar(
        select(models.Expense)
        .join(
            models.Vehicle,
            models.Expense.vehicle_id == models.Vehicle.id,
        )
        .where(
            models.Expense.id == expense_id,
            models.Vehicle.user_id == current_user.id,
        )
    )

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found.",
        )

    db.delete(expense)
    db.commit()


@app.post(
    "/vehicles/{vehicle_id}/reminders",
    response_model=schemas.ReminderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reminder(
    vehicle_id: int,
    reminder: schemas.ReminderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )

    if reminder.due_date is None and reminder.due_mileage is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A reminder must have a due date or a due mileage.",
        )

    new_reminder = models.Reminder(
        vehicle_id=vehicle_id,
        **reminder.model_dump(),
    )

    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)

    return new_reminder


@app.get(
    "/vehicles/{vehicle_id}/reminders",
    response_model=list[schemas.ReminderResponse],
)
def get_vehicle_reminders(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    get_owned_vehicle(
        vehicle_id,
        current_user,
        db,
    )

    reminders = db.scalars(
        select(models.Reminder)
        .where(models.Reminder.vehicle_id == vehicle_id)
        .order_by(models.Reminder.created_at.desc())
    ).all()

    return reminders


@app.put(
    "/reminders/{reminder_id}",
    response_model=schemas.ReminderResponse,
)
def update_reminder(
    reminder_id: int,
    reminder_data: schemas.ReminderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    reminder = db.scalar(
        select(models.Reminder)
        .join(
            models.Vehicle,
            models.Reminder.vehicle_id == models.Vehicle.id,
        )
        .where(
            models.Reminder.id == reminder_id,
            models.Vehicle.user_id == current_user.id,
        )
    )

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found.",
        )

    if (
        reminder_data.due_date is None
        and reminder_data.due_mileage is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A reminder must have a due date or a due mileage.",
        )

    for field, value in reminder_data.model_dump().items():
        setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)

    return reminder


@app.delete(
    "/reminders/{reminder_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    reminder = db.scalar(
        select(models.Reminder)
        .join(
            models.Vehicle,
            models.Reminder.vehicle_id == models.Vehicle.id,
        )
        .where(
            models.Reminder.id == reminder_id,
            models.Vehicle.user_id == current_user.id,
        )
    )

    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reminder not found.",
        )

    db.delete(reminder)
    db.commit()


@app.get(
    "/dashboard",
    response_model=schemas.DashboardResponse,
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    vehicles = db.scalars(
        select(models.Vehicle).where(
            models.Vehicle.user_id == current_user.id
        )
    ).all()

    expenses = db.scalars(
        select(models.Expense)
        .join(
            models.Vehicle,
            models.Expense.vehicle_id == models.Vehicle.id,
        )
        .where(models.Vehicle.user_id == current_user.id)
    ).all()

    maintenances = db.scalars(
        select(models.Maintenance)
        .join(
            models.Vehicle,
            models.Maintenance.vehicle_id == models.Vehicle.id,
        )
        .where(models.Vehicle.user_id == current_user.id)
    ).all()

    reminders = db.scalars(
        select(models.Reminder)
        .join(
            models.Vehicle,
            models.Reminder.vehicle_id == models.Vehicle.id,
        )
        .where(models.Vehicle.user_id == current_user.id)
    ).all()

    total_expenses = sum(
        (expense.amount for expense in expenses),
        start=Decimal("0.00"),
    )

    total_maintenance = sum(
        (maintenance.cost for maintenance in maintenances),
        start=Decimal("0.00"),
    )

    total_spending = total_expenses + total_maintenance

    expenses_by_category: dict[str, Decimal] = {}

    for expense in expenses:
        expenses_by_category[expense.category] = (
            expenses_by_category.get(
                expense.category,
                Decimal("0.00"),
            )
            + expense.amount
        )

    category_stats = [
        {
            "category": category,
            "amount": amount,
        }
        for category, amount in sorted(
            expenses_by_category.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    monthly_data: dict[
        str,
        dict[str, Decimal],
    ] = {}

    for expense in expenses:
        month = expense.date.strftime("%Y-%m")

        if month not in monthly_data:
            monthly_data[month] = {
                "expenses": Decimal("0.00"),
                "maintenance": Decimal("0.00"),
            }

        monthly_data[month]["expenses"] += expense.amount

    for maintenance in maintenances:
        month = maintenance.date.strftime("%Y-%m")

        if month not in monthly_data:
            monthly_data[month] = {
                "expenses": Decimal("0.00"),
                "maintenance": Decimal("0.00"),
            }

        monthly_data[month]["maintenance"] += maintenance.cost

    monthly_spending = []

    for month in sorted(monthly_data.keys()):
        expenses_amount = monthly_data[month]["expenses"]
        maintenance_amount = monthly_data[month]["maintenance"]

        monthly_spending.append(
            {
                "month": month,
                "expenses": expenses_amount,
                "maintenance": maintenance_amount,
                "total": expenses_amount + maintenance_amount,
            }
        )

    vehicle_mileages = {
        vehicle.id: vehicle.mileage
        for vehicle in vehicles
    }

    active_reminders = 0
    overdue_reminders = 0

    today = date.today()

    for reminder in reminders:
        if reminder.completed:
            continue

        active_reminders += 1

        overdue_by_date = (
            reminder.due_date is not None
            and reminder.due_date < today
        )

        vehicle_mileage = vehicle_mileages.get(
            reminder.vehicle_id
        )

        overdue_by_mileage = (
            reminder.due_mileage is not None
            and vehicle_mileage is not None
            and vehicle_mileage >= reminder.due_mileage
        )

        if overdue_by_date or overdue_by_mileage:
            overdue_reminders += 1

    return {
        "vehicles_count": len(vehicles),
        "expenses_count": len(expenses),
        "maintenances_count": len(maintenances),
        "total_expenses": total_expenses,
        "total_maintenance": total_maintenance,
        "total_spending": total_spending,
        "active_reminders": active_reminders,
        "overdue_reminders": overdue_reminders,
        "expenses_by_category": category_stats,
        "monthly_spending": monthly_spending,
    }


@app.post(
    "/auth/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
):
    normalized_email = str(user_data.email).strip().lower()

    existing_user = db.scalar(
        select(models.User).where(
            models.User.email == normalized_email
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    new_user = models.User(
        name=user_data.name.strip(),
        email=normalized_email,
        hashed_password=auth.get_password_hash(
            user_data.password
        ),
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post(
    "/auth/login",
    response_model=schemas.TokenResponse,
)
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    normalized_email = form_data.username.strip().lower()

    user = db.scalar(
        select(models.User).where(
            models.User.email == normalized_email
        )
    )

    if not user:
        auth.verify_password(
            form_data.password,
            auth.DUMMY_HASH,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not auth.verify_password(
        form_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@app.get(
    "/auth/me",
    response_model=schemas.UserResponse,
)
def get_current_user_profile(
    current_user: models.User = Depends(
        auth.get_current_user
    ),
):
    return current_user