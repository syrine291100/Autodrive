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