from fastapi.middleware.cors import CORSMiddleware
from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

import models
import schemas
from database import Base, engine, get_db


Base.metadata.create_all(bind=engine)


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


@app.post(
    "/vehicles",
    response_model=schemas.VehicleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vehicle(
    vehicle: schemas.VehicleCreate,
    db: Session = Depends(get_db),
):
    existing_vehicle = db.scalar(
        select(models.Vehicle).where(
            models.Vehicle.registration == vehicle.registration
        )
    )

    if existing_vehicle:
        raise HTTPException(
            status_code=409,
            detail="A vehicle with this registration already exists.",
        )

    new_vehicle = models.Vehicle(**vehicle.model_dump())

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
):
    vehicles = db.scalars(
        select(models.Vehicle).order_by(models.Vehicle.id)
    ).all()

    return vehicles


@app.get(
    "/vehicles/{vehicle_id}",
    response_model=schemas.VehicleResponse,
)
def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
):
    vehicle = db.get(models.Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    return vehicle


@app.put(
    "/vehicles/{vehicle_id}",
    response_model=schemas.VehicleResponse,
)
def update_vehicle(
    vehicle_id: int,
    vehicle_data: schemas.VehicleCreate,
    db: Session = Depends(get_db),
):
    vehicle = db.get(models.Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
        )

    duplicate = db.scalar(
        select(models.Vehicle).where(
            models.Vehicle.registration == vehicle_data.registration,
            models.Vehicle.id != vehicle_id,
        )
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
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
):
    vehicle = db.get(models.Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
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
):
    vehicle = db.get(models.Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
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
):
    vehicle = db.get(models.Vehicle, vehicle_id)

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found.",
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
):
    maintenance = db.get(models.Maintenance, maintenance_id)

    if not maintenance:
        raise HTTPException(
            status_code=404,
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
):
    maintenance = db.get(models.Maintenance, maintenance_id)

    if not maintenance:
        raise HTTPException(
            status_code=404,
            detail="Maintenance not found.",
        )

    db.delete(maintenance)
    db.commit()